import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import authService from '../services/auth.service';
import env from '../config/env';
import { emailService } from '../services/email.service';
import User from '../models/User';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/imageUpload';
import fs from 'fs';
import path from 'path';
import growthService from '../services/growth.service';
import userService from '../services/user.service';


/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, phone, roles, studentId, department, residenceHall, currentLevel, location, supabaseAccessToken } = req.body;

    const { user, token } = await authService.register({
      supabaseAccessToken,
      name,
      phone,
      roles: roles || ['buyer'],
      studentId,
      department,
      residenceHall,
      currentLevel,
      location,
    });

    // Send welcome email
    emailService.sendWelcomeEmail(user.email, user.name, user.roles[0]).catch((err) => {
      console.error('Welcome email failed:', err);
    });

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: { user, token },
    });

    // Fire analytics asynchronously — don't block response or throw after headers sent
    growthService.captureEvent(user._id.toString(), 'signup', { method: 'email' }).catch((err) => {
      console.error('Analytics signup capture failed:', err);
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { supabaseAccessToken } = req.body;

    const { user, token } = await authService.login({ supabaseAccessToken });

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: { user, token },
    });

    // Fire analytics asynchronously — don't block response or throw after headers sent
    growthService.captureEvent(user._id.toString(), 'login', { method: 'email' }).catch((err) => {
      console.error('Analytics login capture failed:', err);
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await authService.getProfile(req.user!._id.toString());

    res.status(200).json({
      success: true,
      message: 'Profile fetched successfully.',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/profile/stats
 * @desc    Get user performance statistics
 * @access  Private
 */
export const getUserStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const stats = await userService.getUserStats(req.user!._id.toString());

    res.status(200).json({
      success: true,
      message: 'Statistics fetched successfully.',
      data: { stats },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
/**
 * @route   PUT /api/auth/switch-role
 * @desc    Switch user role between buyer and seller
 * @access  Private
 */
export const switchRole = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const targetMode = req.body.targetMode || req.body.role;
    if (!targetMode || !['buyer', 'seller'].includes(targetMode)) {
      res.status(400).json({ 
        success: false, 
        message: 'Role switch requires "targetMode" or "role" (buyer/seller).',
        debug: { body: req.body }
      });
      return;
    }

    const { user, token } = await authService.switchRole(req.user!._id.toString(), targetMode);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      success: true,
      message: `Role switched to ${targetMode}.`,
      data: { user, token },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, phone, avatar, studentId, department, residenceHall, currentLevel, location, bio, storeName, brandName } = req.body;

    const user = await authService.updateProfile(req.user!._id.toString(), {
      name,
      phone,
      avatar,
      studentId,
      department,
      residenceHall,
      currentLevel,
      location,
      bio,
      storeName,
      brandName,
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/profile/avatar
 * @desc    Upload/update user avatar
 * @access  Private
 */
export const uploadAvatar = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No avatar image uploaded.' });
      return;
    }

    const currentUser = await User.findById(req.user!._id);
    if (!currentUser) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    let avatarUrl = '';
    try {
      const uploaded = await uploadToCloudinary(req.file.buffer, 'quads/avatars');
      avatarUrl = uploaded.url;
    } catch {
      const uploadsDir = path.resolve(process.cwd(), 'uploads', 'avatars');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const mime = req.file.mimetype || 'image/jpeg';
      const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : mime.includes('gif') ? 'gif' : 'jpg';
      const filename = `${req.user!._id.toString()}-${Date.now()}.${ext}`;
      const filePath = path.join(uploadsDir, filename);
      fs.writeFileSync(filePath, req.file.buffer);
      avatarUrl = `${req.protocol}://${req.get('host')}/uploads/avatars/${filename}?v=${Date.now()}`;
    }

    const oldAvatar = currentUser.avatar || '';
    if (oldAvatar.includes('/quads/avatars/')) {
      const marker = '/upload/';
      const markerIndex = oldAvatar.indexOf(marker);
      if (markerIndex >= 0) {
        const publicPath = oldAvatar.slice(markerIndex + marker.length).replace(/^v\d+\//, '');
        const publicId = publicPath.replace(/\.[a-z0-9]+$/i, '');
        if (publicId) {
          await deleteFromCloudinary(publicId);
        }
      }
    }

    const user = await authService.updateProfile(req.user!._id.toString(), {
      avatar: avatarUrl,
    });

    res.status(200).json({
      success: true,
      message: 'Profile photo updated.',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change password
 * @access  Private
 */
export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    await authService.changePassword(
      req.user!._id.toString(),
      currentPassword,
      newPassword
    );

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (clear cookie)
 * @access  Private
 */
export const logout = async (
  _req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};

/**
 * @route   PUT /api/auth/settings/notifications
 * @desc    Update notification preferences
 * @access  Private
 */
export const updateNotificationSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { orderUpdates, messages, reviews, promotions, systemAlerts } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user!._id,
      {
        $set: {
          'notificationPrefs.orderUpdates': orderUpdates,
          'notificationPrefs.messages': messages,
          'notificationPrefs.reviews': reviews,
          'notificationPrefs.promotions': promotions,
          'notificationPrefs.systemAlerts': systemAlerts,
        },
      },
      { new: true, runValidators: true }
    );
    res.status(200).json({ success: true, message: 'Notification preferences updated.', data: { user } });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/auth/settings/privacy
 * @desc    Update privacy preferences
 * @access  Private
 */
export const updatePrivacySettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { showPhone, showLocation, allowMessages, showOnlineStatus, responseTimeMinutes } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user!._id,
      {
        $set: {
          'privacyPrefs.showPhone': showPhone,
          'privacyPrefs.showLocation': showLocation,
          'privacyPrefs.allowMessages': allowMessages,
          'privacyPrefs.showOnlineStatus': showOnlineStatus,
          ...(responseTimeMinutes !== undefined ? { responseTimeMinutes } : {}),
        },
      },
      { new: true, runValidators: true }
    );
    res.status(200).json({ success: true, message: 'Privacy settings updated.', data: { user } });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/auth/account
 * @desc    Delete user account (requires password confirmation)
 * @access  Private
 */
export const deleteAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { password } = req.body;

    // Load user with password field
    const user = await User.findById(req.user!._id).select('+password');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    // Standard password-based users must confirm deletion with their password.
    // OAuth (Google/Supabase) users who don't have a local password bypass this check.
    if (!user.supabaseId) {
      if (!password) {
        res.status(400).json({ success: false, message: 'Password is required to delete your account.' });
        return;
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        res.status(401).json({ success: false, message: 'Incorrect password.' });
        return;
      }
    }

    const supabaseId = user.supabaseId;
    await User.findByIdAndDelete(req.user!._id);

    // Also delete from Supabase auth so the email can't receive OTPs or log in again
    if (supabaseId && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
      await fetch(`${process.env.SUPABASE_URL}/auth/v1/admin/users/${supabaseId}`, {
        method: 'DELETE',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        },
      }).catch(err => console.error('[deleteAccount] Supabase user delete failed:', err));
    }

    res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
    res.status(200).json({ success: true, message: 'Account deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/google
 * @desc    Login/Register via Google
 * @access  Public
 */
export const googleLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { credential, role, profileData } = req.body;
    if (!credential) {
      res.status(400).json({ success: false, message: 'Google credential missing' });
      return;
    }
    console.log(`[GoogleLogin] Start: role=${role}`);
    const { user, token, isNewUser, needsProfileCompletion } = await authService.googleLogin(credential, role, profileData);
    console.log(`[GoogleLogin] Success: ${user.email}`);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      success: true,
      message: 'Google login successful.',
      data: { user, token, isNewUser, needsProfileCompletion },
    });

    // Fire analytics asynchronously
    growthService.captureEvent(user._id.toString(), isNewUser ? 'signup' : 'login', { method: 'google' }).catch((err) => {
      console.error('[GoogleLogin] Analytics capture failed:', err);
    });

    // Send welcome email if new user
    if (isNewUser) {
      emailService.sendWelcomeEmail(user.email, user.name, user.roles[0]).catch((err) => {
        console.error('[GoogleLogin] Welcome email failed:', err);
      });
    }
  } catch (error: any) {
    console.error('[GoogleLogin] CRITICAL ERROR:', error.message, error.stack);
    next(error);
  }
};

/**
 * @route   POST /api/auth/upload-id-card
 * @desc    Upload student ID card image for manual admin review
 * @access  Private
 */
export const uploadIdCard = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No image uploaded.' });
      return;
    }

    const user = await User.findById(req.user!._id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    if (user.idVerificationStatus === 'verified') {
      res.status(400).json({ success: false, message: 'ID already verified.' });
      return;
    }

    let imageUrl = '';
    try {
      const uploaded = await uploadToCloudinary(req.file.buffer, 'quads/id-cards');
      imageUrl = uploaded.url;
    } catch {
      const uploadsDir = path.resolve(process.cwd(), 'uploads', 'id-cards');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
      const ext = (req.file.mimetype || 'image/jpeg').includes('png') ? 'png' : 'jpg';
      const filename = `${req.user!._id.toString()}-id-${Date.now()}.${ext}`;
      fs.writeFileSync(path.join(uploadsDir, filename), req.file.buffer);
      imageUrl = `${req.protocol}://${req.get('host')}/uploads/id-cards/${filename}`;
    }

    user.idCardImageUrl = imageUrl;
    user.idVerificationStatus = 'pending';
    user.idSubmittedAt = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'ID card submitted for review.',
      data: { idVerificationStatus: 'pending', idCardImageUrl: imageUrl },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/send-verification-email
 * @desc    Send a 6-digit code to the user's email for verification
 * @access  Private
 */
export const sendEmailVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req.user!._id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    if (user.emailVerified) {
      res.status(400).json({ success: false, message: 'Email is already verified.' });
      return;
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    const hashed = crypto.createHash('sha256').update(code).digest('hex');

    user.emailVerificationToken = hashed;
    user.emailVerificationExpires = expires;
    await user.save();

    await emailService.sendVerificationEmail(user.email, user.name, code);

    res.status(200).json({
      success: true,
      message: `Verification code sent to ${user.email}.`,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/verify-email
 * @desc    Confirm email with the 6-digit code
 * @access  Private
 */
export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { code } = req.body;
    if (!code) {
      res.status(400).json({ success: false, message: 'Verification code is required.' });
      return;
    }

    const user = await User.findById(req.user!._id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    if (user.emailVerified) {
      res.status(400).json({ success: false, message: 'Email is already verified.' });
      return;
    }

    if (!user.emailVerificationToken || !user.emailVerificationExpires) {
      res.status(400).json({ success: false, message: 'No verification code found. Please request a new one.' });
      return;
    }

    if (user.emailVerificationExpires < new Date()) {
      res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new one.' });
      return;
    }

    const hashed = crypto.createHash('sha256').update(code).digest('hex');
    if (hashed !== user.emailVerificationToken) {
      res.status(400).json({ success: false, message: 'Invalid verification code.' });
      return;
    }

    user.emailVerified = true;
    user.emailVerificationToken = '';
    user.emailVerificationExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully.',
      data: { emailVerified: true },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/auth/seller-onboarding
 * @desc    Complete/update seller onboarding wizard
 * @access  Private (Seller/Admin)
 */
export const updateSellerOnboarding = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || (!req.user.roles.includes('seller') && !req.user.roles.includes('admin') && !req.user.roles.includes('buyer'))) {
      res.status(403).json({ success: false, message: 'Access denied.' });
      return;
    }

    const {
      storeName,
      brandName,
      responseTimeMinutes,
      payoutMethod,
      payoutProvider,
      payoutAccountName,
      payoutAccountNumber,
      identityStatus,
      completed,
    } = req.body;

    const current = await User.findById(req.user._id);
    if (!current) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    const onboardingPatch: any = {
      payoutSetupComplete: !!(payoutMethod && payoutAccountNumber && payoutAccountName),
      payoutMethod,
      payoutProvider,
      payoutAccountName,
      payoutAccountNumber,
      identityDocumentUrl: current.sellerOnboarding?.identityDocumentUrl || '',
      identityStatus: identityStatus || current.sellerOnboarding?.identityStatus || 'not_submitted',
      identitySubmittedAt: current.sellerOnboarding?.identitySubmittedAt,
      completed: !!completed,
      completedAt: completed ? new Date() : current.sellerOnboarding?.completedAt,
    };

    const user = await authService.updateProfile(req.user._id.toString(), {
      storeName,
      brandName,
      sellerOnboarding: onboardingPatch,
      ...(responseTimeMinutes !== undefined ? { responseTimeMinutes } : {}),
    } as any);

    // Sync Store if exists
    if (user.activeStore) {
      const Store = mongoose.model('Store');
      await Store.findByIdAndUpdate(user.activeStore, {
        name: storeName || user.name,
        payoutSetupComplete: onboardingPatch.payoutSetupComplete,
        payoutMethod: onboardingPatch.payoutMethod,
        payoutProvider: onboardingPatch.payoutProvider,
        payoutAccountName: onboardingPatch.payoutAccountName,
        payoutAccountNumber: onboardingPatch.payoutAccountNumber,
      });
    }

    if (completed && !user.roles.includes('seller')) {
      await authService.switchRole(user._id.toString(), 'seller');
    }

    res.status(200).json({ success: true, message: 'Seller onboarding updated.', data: { user } });
  } catch (error) {
    next(error);
  }
};

import otpService from '../services/otp.service';

export const sendOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, purpose } = req.body;
    if (!email || !['login', 'register'].includes(purpose)) {
      res.status(400).json({ success: false, message: 'email and purpose (login|register) required.' });
      return;
    }
    await otpService.sendOtp(email, purpose as 'login' | 'register');
    res.status(200).json({ success: true, message: `Verification code sent to ${email}.` });
  } catch (error) { next(error); }
};

export const verifyOtpLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, code } = req.body;
    if (!email || !code) { res.status(400).json({ success: false, message: 'email and code required.' }); return; }
    const result = await otpService.verifyOtp(email, code, 'login');
    res.status(200).json({ success: true, data: { token: result.token, user: result.user } });
  } catch (error) { next(error); }
};

export const verifyOtpRegister = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, code, profile } = req.body;
    if (!email || !code) { res.status(400).json({ success: false, message: 'email and code required.' }); return; }

    if (profile) {
      // Full register — verify + create account in one call
      await otpService.verifyOtp(email, code, 'register');
      const result = await otpService.completeRegistration(email, profile);
      res.status(201).json({ success: true, data: { token: result.token, user: result.user } });
    } else {
      // Just verify the code (two-step flow)
      await otpService.verifyOtp(email, code, 'register');
      res.status(200).json({ success: true, message: 'Email verified.' });
    }
  } catch (error) { next(error); }
};
