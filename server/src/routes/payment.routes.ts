import { Router } from 'express';
import {
  initiatePayment,
  verifyPayment,
  handleWebhook,
  getTransaction,
  refundPayment,
} from '../controllers/payment.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// POST /api/payments/webhook — Paystack webhook (public, validated by signature)
router.post('/webhook', handleWebhook);

// Public payment success landing page (redirect target)
router.get('/verify-success', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Successful</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #f3f3eb;
            color: #1f1a14;
            text-align: center;
            padding: 40px 20px;
            margin: 0;
          }
          .card {
            background: #ffffff;
            border: 3px solid #1f1a14;
            padding: 40px 30px;
            max-width: 400px;
            margin: 40px auto 0 auto;
            box-shadow: 6px 6px 0px #1f1a14;
          }
          .icon {
            font-size: 60px;
            margin-bottom: 20px;
          }
          h1 {
            font-size: 24px;
            font-weight: 900;
            text-transform: uppercase;
            margin: 0 0 12px 0;
            letter-spacing: 1px;
          }
          p {
            font-size: 14px;
            color: #7b6f61;
            margin-bottom: 30px;
            line-height: 1.6;
            font-weight: 500;
          }
          .btn {
            display: inline-block;
            background-color: #2f5d4f;
            color: #ffffff;
            text-decoration: none;
            padding: 14px 28px;
            font-weight: 900;
            border: 2px solid #1f1a14;
            box-shadow: 4px 4px 0px #1f1a14;
            text-transform: uppercase;
            font-size: 13px;
            letter-spacing: 1.2px;
            cursor: pointer;
            transition: all 0.15s ease;
          }
          .btn:active {
            transform: translate(2px, 2px);
            box-shadow: 2px 2px 0px #1f1a14;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">🎉</div>
          <h1>Payment Received!</h1>
          <p>Your escrow holding has been successfully established on QUADS. You can now close this browser window and return to your mobile app to track your order.</p>
          <div class="btn" onclick="window.close();">Continue in App</div>
        </div>
      </body>
    </html>
  `);
});

// All other payment routes require authentication
router.post('/initiate', authenticate, initiatePayment);
router.get('/verify/:reference', authenticate, verifyPayment);
router.get('/transaction/:reference', authenticate, getTransaction);
router.post('/refund', authenticate, authorize('admin'), refundPayment);

export default router;
