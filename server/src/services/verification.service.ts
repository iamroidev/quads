import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import crypto from 'crypto';
import VerificationCode from '../models/VerificationCode';
import User from '../models/User';
import env from '../config/env';
import { emailService } from './email.service';
import ApiError from '../utils/ApiError';

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
          <div style="font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #666;">CampusMarketplace</div>
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
      subject: 'Verify your CampusMarketplace email',
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
        Message: `Your CampusMarketplace verification code is: ${code}. Valid for 10 minutes.`,
        PhoneNumber: formattedPhone,
        MessageAttributes: {
          'AWS.SNS.SMS.SenderID': {
            DataType: 'String',
            StringValue: env.AWS_SNS_SENDER_ID || 'CAMPUS',
          },
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

    // If user now has at least one verification, mark isVerified
    const user = await User.findById(userId);
    if (user) {
      const newEmailVerified = type === 'email' ? true : user.emailVerified;
      const newPhoneVerified = type === 'phone' ? true : user.phoneVerified;
      update.isVerified = newEmailVerified || newPhoneVerified;

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
      role: user.role,
    };
  }
}

export default new VerificationService();