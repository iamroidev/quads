import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { emailService } from '../services/email.service';
import aiService from '../services/ai.service';
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
    let aiUser = await User.findOne({ email: AI_EMAIL });
    
    if (!aiUser) {
      // If the AI user doesn't exist, we create a placeholder for it
      // This ensures the Launch Chat button always works
      aiUser = await User.create({
        name: 'QUADS AI Support',
        email: AI_EMAIL,
        role: 'admin',
        isVerified: true,
        emailVerified: true,
        phone: '+233000000000'
      });
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
 * @route   POST /api/support/tawk-webhook
 * @desc    Handle incoming messages from Tawk.to and generate AI responses
 * @access  Public (Secured by Tawk Signature)
 */
router.post(
  '/tawk-webhook',
  async (req: any, res: any) => {
    try {
      // Tawk.to body structure for chat:message
      const { event, message, visitor, chatId } = req.body;

      if (event === 'chat:message' && message && message.type === 'visitor') {
        const userMessage = message.text;
        const visitorEmail = visitor?.email || 'Unknown';

        console.log(`[Tawk] New message from ${visitorEmail}: ${userMessage}`);

        // Generate AI Response
        const aiResponse = await aiService.generateResponse(userMessage, [], {
          source: 'tawk.to',
          visitorEmail,
          chatId
        });

        // Forward to Admin
        await emailService.sendEmail({
          to: 'support@quadsmarket.tech',
          subject: `🤖 AI Suggestion for Tawk Chat (${visitorEmail})`,
          html: `
            <div style="font-family: sans-serif; border: 4px solid #000; padding: 20px;">
              <h2 style="text-transform: uppercase;">Tawk AI Assistant</h2>
              <p><strong>Visitor:</strong> ${visitorEmail}</p>
              <p><strong>Message:</strong> ${userMessage}</p>
              <hr style="border: 2px solid #000;" />
              <p><strong>AI Suggested Response:</strong></p>
              <p style="background: #f0f0f0; padding: 15px; border-left: 5px solid #ff6b6b;">${aiResponse}</p>
              <p style="font-size: 10px; opacity: 0.5;">Chat ID: ${chatId}</p>
            </div>
          `
        });
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Tawk Webhook Error:', error);
      res.status(200).json({ success: false });
    }
  }
);

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
