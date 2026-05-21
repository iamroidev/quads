import { Request, Response, NextFunction } from 'express';
import paymentService from '../services/payment.service';
import { validateWebhookSignature, initiateRefund } from '../utils/paystack';
import ApiError from '../utils/ApiError';
import Order from '../models/Order';
import Transaction from '../models/Transaction';
import User from '../models/User';
import OpsAuditLog from '../models/OpsAuditLog';
import notificationService from '../services/notification.service';
import { emailService } from '../services/email.service';

/**
 * @route   POST /api/payments/initiate
 * @desc    Initiate payment for an order via Paystack
 * @access  Private (buyer)
 */
export const initiatePayment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { orderId, paymentMethod, callbackUrl } = req.body;

    if (!orderId || !paymentMethod || !callbackUrl) {
      throw ApiError.badRequest('orderId, paymentMethod, and callbackUrl are required');
    }

    const result = await paymentService.initiatePayment(
      orderId,
      req.user!._id.toString(),
      paymentMethod,
      callbackUrl
    );

    res.status(200).json({
      success: true,
      message: 'Payment initialized',
      data: {
        authorizationUrl: result.authorizationUrl,
        reference: result.reference,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/payments/verify/:reference
 * @desc    Verify a payment after Paystack redirect
 * @access  Private
 */
export const verifyPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { reference } = req.params;

    if (!reference) {
      throw ApiError.badRequest('Payment reference is required');
    }

    const result = await paymentService.verifyPayment(reference);

    res.status(200).json({
      success: true,
      message: result.verified ? 'Payment verified successfully' : 'Payment not verified',
      data: {
        verified: result.verified,
        order: result.order,
        transaction: result.transaction,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/payments/webhook
 * @desc    Handle Paystack webhook events
 * @access  Public (validated by signature)
 */
export const handleWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const signature = req.headers['x-paystack-signature'] as string;

    if (!signature) {
      res.status(400).json({ success: false, message: 'No signature provided' });
      return;
    }

    // Validate webhook signature using raw body
    const rawBody = (req as any).rawBody;
    if (!rawBody) {
      res.status(400).json({ success: false, message: 'Raw body not available' });
      return;
    }

    const isValid = validateWebhookSignature(rawBody, signature);
    if (!isValid) {
      res.status(401).json({ success: false, message: 'Invalid signature' });
      return;
    }

    const { event, data } = req.body;

    await paymentService.handleWebhook(event, data);

    // Paystack expects a 200 response
    res.status(200).json({ success: true });
  } catch (error: any) {
    // Always return 200 to Paystack to prevent retries
    console.error('Webhook processing error:', error);
    try {
      // Create OpsAuditLog
      await OpsAuditLog.create({
        action: 'WEBHOOK_FAILURE',
        details: {
          error: error.message || String(error),
          body: req.body,
        },
      });

      // Find all admin users
      const admins = await User.find({ roles: 'admin' });
      for (const admin of admins) {
        // In-app notification
        await notificationService.create(
          admin._id.toString(),
          'order_cancelled',
          'Webhook Failure Alert',
          `Paystack webhook failed to process: ${error.message || error}`,
          '/admin/dashboard'
        );

        // Email notification
        if (admin.email) {
          await emailService.sendWebhookFailureAlertEmail(
            admin.email,
            error.message || String(error),
            req.body
          );
        }
      }
    } catch (auditError) {
      console.error('Failed to log webhook failure audit:', auditError);
    }
    res.status(200).json({ success: true });
  }
};

/**
 * @route   GET /api/payments/transaction/:reference
 * @desc    Get transaction details by reference
 * @access  Private
 */
export const getTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const transaction = await paymentService.getTransactionByReference(
      req.params.reference
    );

    res.status(200).json({
      success: true,
      data: { transaction },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/payments/refund
 * @desc    Admin triggered refund (full or partial amount)
 * @access  Private (admin)
 */
export const refundPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { orderId, amount, reason } = req.body;

    if (!orderId) {
      throw ApiError.badRequest('orderId is required');
    }

    const order = await Order.findById(orderId).populate('payment');
    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    // Amount to refund (default to full order total if not specified)
    const refundAmount = amount !== undefined ? Number(amount) : order.totalAmount;
    if (refundAmount <= 0 || refundAmount > order.totalAmount) {
      throw ApiError.badRequest(`Invalid refund amount. Must be between 0 and ${order.totalAmount}`);
    }

    let paystackResponse = undefined;
    if (order.payment && (order.payment as any).reference && (order.payment as any).status === 'success') {
      try {
        const paystackRefund = await initiateRefund(
          (order.payment as any).reference,
          refundAmount,
          reason || `Admin refund for order ${order.orderNumber}`
        );
        paystackResponse = paystackRefund;
      } catch (paystackErr: any) {
        console.error('Paystack refund failed:', paystackErr.message);
        await OpsAuditLog.create({
          action: 'PAYMENT_REFUND_FAILED',
          userId: req.user?._id,
          details: {
            orderId: order._id,
            reference: (order.payment as any).reference,
            amount: refundAmount,
            error: paystackErr.response?.data || paystackErr.message,
          },
        });
        throw ApiError.internal(`Paystack refund failed: ${paystackErr.response?.data?.message || paystackErr.message}`);
      }
    }

    // Create refund transaction
    const refundReference = `REFUND-${order.orderNumber}-${Date.now()}`.toUpperCase();
    const refundTx = await Transaction.create({
      order: order._id,
      reference: refundReference,
      amount: refundAmount,
      currency: 'GHS',
      paymentMethod: (order.payment as any)?.paymentMethod || 'momo',
      status: 'refunded',
      paystackResponse,
      paidAt: new Date(),
    });

    // Update order status if full refund
    if (refundAmount === order.totalAmount) {
      order.status = 'refunded';
      await order.save();
    }

    await OpsAuditLog.create({
      action: 'PAYMENT_REFUND_SUCCESS',
      userId: req.user?._id,
      details: {
        orderId: order._id,
        refundReference,
        amount: refundAmount,
        reason,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        transaction: refundTx,
        orderStatus: order.status,
      },
    });
  } catch (error) {
    next(error);
  }
};
