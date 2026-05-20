import crypto from 'crypto';
import VerificationCode from '../models/VerificationCode';
import User from '../models/User';
import { emailService } from './email.service';
import authService from './auth.service';
import ApiError from '../utils/ApiError';
import { generateToken } from '../utils/jwt';

const OTP_TTL_MS   = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

function generateCode(): string {
  // Cryptographically random 6-digit code
  return String(crypto.randomInt(100000, 999999));
}

class OtpService {
  /**
   * Send a 6-digit OTP to an email address.
   * purpose='login'    — only sends if a QUADS account exists for that email
   * purpose='register' — sends regardless (account created after verify)
   */
  async sendOtp(email: string, purpose: 'login' | 'register'): Promise<void> {
    const normalised = email.toLowerCase().trim();

    if (purpose === 'login') {
      const user = await User.findOne({ email: normalised }).select('_id');
      if (!user) {
        throw ApiError.notFound('No account found with that email address. Please sign up first.');
      }
    }

    // Invalidate any existing unused codes for this email + purpose
    await VerificationCode.deleteMany({ email: normalised, purpose, verifiedAt: { $exists: false } });

    const code = generateCode();

    await VerificationCode.create({
      email:       normalised,
      code,
      type:        'email',
      purpose,
      expiresAt:   new Date(Date.now() + OTP_TTL_MS),
      attempts:    0,
      maxAttempts: MAX_ATTEMPTS,
    });

    // Fire email non-blocking — code is already saved, don't let Resend latency block the response
    emailService.sendOtpEmail(normalised, code).catch(err =>
      console.error('[OtpService] Email send failed:', err?.message)
    );
  }

  /**
   * Verify a submitted OTP and return a JWT + user for login,
   * or just confirm validity for register (caller provides profile data separately).
   */
  async verifyOtp(
    email: string,
    code: string,
    purpose: 'login' | 'register'
  ): Promise<{ verified: true; token?: string; user?: any }> {
    const normalised = email.toLowerCase().trim();

    const record = await VerificationCode.findOne({
      email:   normalised,
      purpose,
      verifiedAt: { $exists: false },
    }).sort({ createdAt: -1 });

    if (!record) {
      throw ApiError.badRequest('No verification code found. Please request a new one.');
    }

    if (record.expiresAt < new Date()) {
      await record.deleteOne();
      throw ApiError.badRequest('This code has expired. Please request a new one.');
    }

    if (record.attempts >= record.maxAttempts) {
      await record.deleteOne();
      throw ApiError.badRequest('Too many incorrect attempts. Please request a new code.');
    }

    if (record.code !== code.trim()) {
      record.attempts += 1;
      await record.save();
      const remaining = record.maxAttempts - record.attempts;
      throw ApiError.badRequest(
        remaining > 0
          ? `Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
          : 'Too many incorrect attempts. Please request a new code.'
      );
    }

    // Mark as used
    record.verifiedAt = new Date();
    await record.save();

    if (purpose === 'login') {
      const user = await User.findOne({ email: normalised });
      if (!user) throw ApiError.notFound('Account not found.');
      if (user.isBanned) throw ApiError.forbidden('Your account has been suspended.');

      const token = generateToken({
        userId:   user._id.toString(),
        roles:    user.roles,
        viewMode: user.viewMode,
      });

      return { verified: true, token, user };
    }

    return { verified: true };
  }

  /**
   * Complete registration after OTP verified — creates the DB record.
   */
  async completeRegistration(
    email: string,
    profile: {
      name: string;
      phone: string;
      roles: ('buyer' | 'seller')[];
      password?: string;
      studentId?: string;
      department?: string;
      residenceHall?: string;
      currentLevel?: string;
      location?: string;
    }
  ): Promise<{ token: string; user: any }> {
    const normalised = email.toLowerCase().trim();

    // Check OTP was verified in the last 30 minutes
    const record = await VerificationCode.findOne({
      email:   normalised,
      purpose: 'register',
      verifiedAt: { $exists: true, $gte: new Date(Date.now() - 30 * 60 * 1000) },
    });

    if (!record) {
      throw ApiError.badRequest('Email not verified. Please complete OTP verification first.');
    }

    const existing = await User.findOne({ email: normalised });
    if (existing) {
      // Already registered — just log them in
      const token = generateToken({
        userId:   existing._id.toString(),
        roles:    existing.roles,
        viewMode: existing.viewMode,
      });
      return { token, user: existing };
    }

    // Create the user — no Supabase dependency
    const Store = (await import('../models/Store')).default;
    const slugify = (t: string) => t.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

    const user = await User.create({
      name:          profile.name.trim(),
      email:         normalised,
      phone:         profile.phone || '',
      roles:         profile.roles || ['buyer'],
      studentId:     profile.studentId || '',
      department:    profile.department || '',
      residenceHall: profile.residenceHall || '',
      currentLevel:  profile.currentLevel || '',
      location:      profile.location || '',
      isVerified:    false,
      emailVerified: true, // OTP counts as email verification
      phoneVerified: false,
      isBanned:      false,
      password:      profile.password || crypto.randomBytes(16).toString('hex'),
    });

    // Create store if seller
    if (profile.roles.includes('seller')) {
      const baseSlug = slugify(profile.name);
      let slug = baseSlug; let n = 1;
      while (await Store.findOne({ slug })) slug = `${baseSlug}-${n++}`;
      const store = await Store.create({ ownerId: user._id, name: profile.name, slug });
      user.activeStore = store._id as any;
      await user.save();
    }

    const token = generateToken({
      userId:   user._id.toString(),
      roles:    user.roles,
      viewMode: user.viewMode,
    });

    // Fire welcome email non-blocking
    emailService.sendWelcomeEmail(user.email, user.name, user.roles.includes('seller') ? 'seller' : 'buyer').catch(() => {});

    return { token, user };
  }
}

export default new OtpService();
