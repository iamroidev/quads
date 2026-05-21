import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import crypto from 'crypto';
import VerificationCode from '../models/VerificationCode';
import User from '../models/User';
import env from '../config/env';
import { emailService } from './email.service';
import ApiError from '../utils/ApiError';
import firebaseAdmin from '../config/firebase';

// If explicit credentials are set in .env, use them.
// Otherwise fall through to the AWS default credential provider chain
// (i.e. `aws configure`, instance profile, ECS task role, etc.)
const snsConfig = env.AWS_ACCESS_KEY_ID
  ? {
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    }
  : { region: env.AWS_REGION };

// Always create the client — the SDK resolves credentials lazily at call-time.
const sns = new SNSClient(snsConfig);

class VerificationService {
  /**
   * Check if email domain matches UMaT institutional domains
   */
  public isInstitutionalEmail(email?: string): boolean {
    if (!email) return false;
    return /@(student\.)?umat\.edu\.gh$/i.test(email) || /@st\.umat\.edu\.gh$/i.test(email);
  }

  /**
   * Generate a 6-digit OTP code
   */
  private generateCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Send a verification code via email
   */
  async sendEmailOTP(userId: string, email: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    const code = this.generateCode();

    // Invalidate any previous unverified codes for this email/purpose
    await VerificationCode.updateMany(
      { userId, type: 'email', purpose: 'verify_email', verifiedAt: null },
      { $set: { expiresAt: new Date(0) } }
    );

    await VerificationCode.create({
      userId,
      email: email.toLowerCase(),
      code,
      type: 'email',
      purpose: 'verify_email',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; padding: 32px; border: 2px solid #000;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #666;">QUADS</div>
        </div>
        <h1 style="font-size: 18px; font-weight: bold; margin-bottom: 16px;">Verify your email</h1>
        <p style="color: #555; line-height: 1.6; margin-bottom: 24px;">
          Enter this code to verify your email address. It expires in 10 minutes.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; background: #f5f5f5; padding: 16px 32px; border: 2px solid #000;">
            ${code}
          </span>
        </div>
        <p style="color: #999; font-size: 12px; margin-top: 24px;">
          If you didn't request this code, you can ignore this email.
        </p>
      </div>
    `;

    await emailService.sendEmail({
      to: email,
      subject: 'Verify your QUADS email',
      html,
    });
  }

  /**
   * Send a verification code via SMS using AWS SNS
   */
  async sendPhoneOTP(userId: string, phone: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    const code = this.generateCode();

    // Invalidate previous codes
    await VerificationCode.updateMany(
      { userId, type: 'phone', purpose: 'verify_phone', verifiedAt: null },
      { $set: { expiresAt: new Date(0) } }
    );

    await VerificationCode.create({
      userId,
      phone,
      code,
      type: 'phone',
      purpose: 'verify_phone',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    // Format phone for international (Ghana: +233)
    let formattedPhone = phone.trim();
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '+233' + formattedPhone.slice(1);
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+233' + formattedPhone;
    }

    try {
      await sns.send(new PublishCommand({
        Message: `Your QUADS verification code is: ${code}. Valid for 10 minutes.`,
        PhoneNumber: formattedPhone,
        MessageAttributes: {
          // 'AWS.SNS.SMS.SenderID': {
          //   DataType: 'String',
          //   StringValue: env.AWS_SNS_SENDER_ID || 'CAMPUS',
          // },
          'AWS.SNS.SMS.SMSType': {
            DataType: 'String',
            StringValue: 'Transactional',
          },
        },
      }));
    } catch (error: any) {
      console.error('SNS send failed:', error);
      throw ApiError.internal('Failed to send SMS. Check the phone number and AWS SNS configuration.');
    }
  }

  /**
   * Verify a code (email or phone)
   */
  async verifyCode(
    userId: string,
    code: string,
    type: 'email' | 'phone'
  ): Promise<void> {
    const record = await VerificationCode.findOne({
      userId,
      type,
      purpose: type === 'email' ? 'verify_email' : 'verify_phone',
      verifiedAt: null,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!record) {
      throw ApiError.badRequest(
        'No valid verification code found. Request a new one.'
      );
    }

    if (record.attempts >= record.maxAttempts) {
      record.expiresAt = new Date(0);
      await record.save();
      throw ApiError.badRequest(
        'Too many failed attempts. Request a new code.'
      );
    }

    record.attempts += 1;

    if (record.code !== code) {
      await record.save();
      throw ApiError.badRequest(
        `Incorrect code. ${record.maxAttempts - record.attempts} attempts remaining.`
      );
    }

    // Code matched — mark as verified
    record.verifiedAt = new Date();
    await record.save();

    // Update the User record
    const update: Record<string, any> = {};
    if (type === 'email') {
      update.emailVerified = true;
    } else {
      update.phoneVerified = true;
    }

    // A user is only verified if they verify an institutional email OR their ID card is verified.
    const user = await User.findById(userId);
    if (user) {
      const newEmailVerified = type === 'email' ? true : user.emailVerified;
      const emailToCheck = type === 'email' && record.email ? record.email : user.email;
      const isInstitutional = this.isInstitutionalEmail(emailToCheck);
      
      update.isVerified = (newEmailVerified && isInstitutional) || user.idVerificationStatus === 'verified';

      if (type === 'email' && record.email) {
        // If the user signed up with a different email and is verifying their student email,
        // store the verified email reference
        update.email = record.email;
      }
      if (type === 'phone' && record.phone) {
        update.phone = record.phone;
      }
    }

    await User.findByIdAndUpdate(userId, { $set: update });
  }

  /**
   * Get the current verification status for a user
   */
  async getVerificationStatus(userId: string) {
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    return {
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      isVerified: user.isVerified,
      email: user.email,
      phone: user.phone,
      roles: user.roles,
    };
  }

  /**
   * Verify Firebase Phone Auth token and update user
   */
  async verifyFirebasePhone(userId: string, idToken: string): Promise<void> {
    if (!firebaseAdmin) {
      throw ApiError.internal('Firebase Admin not initialized');
    }

    try {
      // 1. Verify the ID token
      const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
      const phoneNumber = decodedToken.phone_number;

      if (!phoneNumber) {
        throw ApiError.badRequest('No phone number found in Firebase token');
      }

      // 2. Update the user
      const user = await User.findById(userId);
      if (!user) throw ApiError.notFound('User not found');

      user.phone = phoneNumber;
      user.phoneVerified = true;
      // Phone verification alone does not set isVerified. Only institutional email or ID verification does.
      user.isVerified = (user.emailVerified && this.isInstitutionalEmail(user.email)) || user.idVerificationStatus === 'verified';
      
      await user.save();
    } catch (error: any) {
      console.error('Firebase verify failed:', error);
      throw ApiError.badRequest('Failed to verify phone number with Firebase');
    }
  }
}

export default new VerificationService();