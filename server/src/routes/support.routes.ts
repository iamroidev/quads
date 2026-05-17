import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { emailService } from '../services/email.service';
import User from '../models/User';
import ApiError from '../utils/ApiError';

const router = Router();

/**
 * @route   GET /api/support/ai-user
 * @desc    Get the AI Support user's information
 * @access  Public
 */
router.get('/ai-user', async (req, res, next) => {
  try {
    const AI_EMAIL = 'support@quadsmarket.tech';
    const AI_AVATAR = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="12" fill="%23ffd700"/><circle cx="50" cy="50" r="30" fill="%23000000"/><circle cx="40" cy="45" r="5" fill="%23ff6b6b"/><circle cx="60" cy="45" r="5" fill="%23ff6b6b"/><rect x="42" y="65" width="16" height="4" fill="%23ffffff"/><path d="M50 10v10" stroke="%23000000" stroke-width="4"/><circle cx="50" cy="8" r="4" fill="%23ff6b6b"/></svg>';
    let aiUser = await User.findOne({ email: AI_EMAIL });
    
    if (!aiUser) {
      aiUser = await User.create({
        name: 'QUADS AI Support',
        email: AI_EMAIL,
        role: 'admin',
        isVerified: true,
        emailVerified: true,
        phone: '+233000000000',
        avatar: AI_AVATAR
      });
    } else if (!aiUser.avatar) {
      aiUser.avatar = AI_AVATAR;
      await aiUser.save();
    }

    res.status(200).json({
      success: true,
      data: {
        userId: aiUser._id,
        name: aiUser.name,
        avatar: aiUser.avatar
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/support/ticket
 * @desc    Submit a support ticket
 * @access  Public
 */
router.post(
  '/ticket',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('subject').notEmpty().withMessage('Subject is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('message').notEmpty().withMessage('Message is required'),
  ],
  validate,
  async (req: any, res: any, next: any) => {
    try {
      const { email, subject, category, message } = req.body;

      // Send email to support team
      await emailService.sendEmail({
        to: 'support@quadsmarket.tech',
        subject: `[SUPPORT TICKET] ${category.toUpperCase()}: ${subject}`,
        html: `
          <h2>New Support Ticket</h2>
          <p><strong>From:</strong> ${email}</p>
          <p><strong>Category:</strong> ${category}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <hr />
          <p><strong>Message:</strong></p>
          <p style="white-space: pre-wrap;">${message}</p>
        `,
      });

      // Send confirmation to user
      await emailService.sendEmail({
        to: email,
        subject: 'We received your support ticket - QUADS',
        html: `
          <h1>Thanks for reaching out!</h1>
          <p>Our team has received your ticket regarding "<strong>${subject}</strong>".</p>
          <p>We usually respond within 24 hours.</p>
          <br />
          <p>Best regards,<br />QUADS Support Team</p>
        `,
      });

      res.status(200).json({
        success: true,
        message: 'Support ticket submitted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
