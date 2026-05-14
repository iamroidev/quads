import { Router } from 'express';
import { body } from 'express-validator';
import {
  sendEmailOTP,
  sendPhoneOTP,
  verifyCode,
  verifyFirebasePhone,
  getVerificationStatus,
} from '../controllers/verification.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// @route   POST /api/verification/send-email
router.post(
  '/send-email',
  authenticate,
  [
    body('email').isEmail().withMessage('A valid email is required'),
    validate,
  ],
  sendEmailOTP
);

// @route   POST /api/verification/send-sms
router.post(
  '/send-sms',
  authenticate,
  [
    body('phone')
      .trim()
      .isLength({ min: 10 })
      .withMessage('A valid phone number is required'),
    validate,
  ],
  sendPhoneOTP
);

// @route   POST /api/verification/verify
router.post(
  '/verify',
  authenticate,
  [
    body('code')
      .trim()
      .isLength({ min: 6, max: 6 })
      .withMessage('Verification code must be 6 digits'),
    body('type')
      .isIn(['email', 'phone'])
      .withMessage('Type must be "email" or "phone"'),
    validate,
  ],
  verifyCode
);

// @route   POST /api/verification/verify-firebase
router.post(
  '/verify-firebase',
  authenticate,
  [
    body('idToken').notEmpty().withMessage('Firebase ID token is required'),
    validate,
  ],
  verifyFirebasePhone
);

// @route   GET /api/verification/status
router.get('/status', authenticate, getVerificationStatus);

export default router;