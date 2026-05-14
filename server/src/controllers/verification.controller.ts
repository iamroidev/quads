import { Request, Response, NextFunction } from 'express';
import verificationService from '../services/verification.service';

/**
 * @route   POST /api/verification/send-email
 * @desc    Send email verification OTP
 * @access  Private
 */
export const sendEmailOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: 'Email is required.' });
      return;
    }
    await verificationService.sendEmailOTP(req.user!._id.toString(), email);
    res.status(200).json({
      success: true,
      message: 'Verification code sent to your email.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/verification/send-sms
 * @desc    Send phone verification OTP via AWS SNS
 * @access  Private
 */
export const sendPhoneOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { phone } = req.body;
    if (!phone) {
      res.status(400).json({ success: false, message: 'Phone number is required.' });
      return;
    }
    await verificationService.sendPhoneOTP(req.user!._id.toString(), phone);
    res.status(200).json({
      success: true,
      message: 'Verification code sent via SMS.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/verification/verify
 * @desc    Verify an OTP code
 * @access  Private
 */
export const verifyCode = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { code, type } = req.body;
    if (!code || !type) {
      res.status(400).json({ success: false, message: 'Code and type are required.' });
      return;
    }
    if (!['email', 'phone'].includes(type)) {
      res.status(400).json({ success: false, message: 'Type must be "email" or "phone".' });
      return;
    }
    await verificationService.verifyCode(req.user!._id.toString(), code, type);
    res.status(200).json({
      success: true,
      message: type === 'email' ? 'Email verified successfully!' : 'Phone number verified successfully!',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/verification/verify-firebase
 * @desc    Verify a Firebase ID token for phone verification
 * @access  Private
 */
export const verifyFirebasePhone = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      res.status(400).json({ success: false, message: 'Firebase ID token is required.' });
      return;
    }
    await verificationService.verifyFirebasePhone(req.user!._id.toString(), idToken);
    res.status(200).json({
      success: true,
      message: 'Phone number verified successfully via Firebase!',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/verification/status
 * @desc    Get user's verification status
 * @access  Private
 */
export const getVerificationStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const status = await verificationService.getVerificationStatus(req.user!._id.toString());
    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
};