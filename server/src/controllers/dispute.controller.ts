import { Request, Response, NextFunction } from 'express';
import Dispute from '../models/Dispute';
import Order from '../models/Order';
import Transaction from '../models/Transaction';
import OpsAuditLog from '../models/OpsAuditLog';
import notificationService from '../services/notification.service';
import { initiateRefund } from '../utils/paystack';

/**
 * @route   POST /api/disputes
 * @desc    Raise a dispute on an order
 * @access  Private
 */
export const createDispute = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { orderId, reason, description, evidence } = req.body;
    const userId = req.user!._id;

    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    // Only buyer or seller of the order can raise a dispute
    const isBuyer = order.buyer.toString() === userId.toString();
    const isSeller = order.seller.toString() === userId.toString();
    if (!isBuyer && !isSeller) {
      res.status(403).json({ success: false, message: 'Access denied.' });
      return;
    }

    // Only paid+ orders can be disputed
    const validStatuses = ['paid', 'confirmed', 'ready', 'completed'];
    if (!validStatuses.includes(order.status)) {
      res.status(400).json({ success: false, message: 'Order cannot be disputed in its current status.' });
      return;
    }

    // Check for existing open dispute
    const existing = await Dispute.findOne({ order: orderId, status: { $in: ['open', 'under_review'] } });
    if (existing) {
      res.status(409).json({ success: false, message: 'An open dispute already exists for this order.' });
      return;
    }

    const against = isBuyer ? order.seller : order.buyer;
    const dispute = await Dispute.create({
      order: orderId,
      raisedBy: userId,
      against,
      reason,
      description,
      evidence: Array.isArray(evidence) ? evidence.filter(Boolean) : [],
    });

    // Mark order as disputed
    await Order.findByIdAndUpdate(orderId, { status: 'disputed' });

    res.status(201).json({ success: true, message: 'Dispute raised successfully.', data: { dispute } });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/disputes/my
 * @desc    Get disputes raised by or against the current user
 * @access  Private
 */
export const getMyDisputes = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id;
    const disputes = await Dispute.find({
      $or: [{ raisedBy: userId }, { against: userId }],
    })
      .populate('order', 'orderNumber totalAmount status')
      .populate('raisedBy', 'name email')
      .populate('against', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: { disputes } });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/disputes/:id
 * @desc    Get a single dispute
 * @access  Private (party member or admin)
 */
export const getDispute = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id.toString();
    const isAdmin = req.user!.roles.includes('admin');

    const dispute = await Dispute.findById(req.params.id)
      .populate('order', 'orderNumber totalAmount status items')
      .populate('raisedBy', 'name email avatar')
      .populate('against', 'name email avatar');

    if (!dispute) {
      res.status(404).json({ success: false, message: 'Dispute not found.' });
      return;
    }

    const isParty =
      dispute.raisedBy._id.toString() === userId ||
      dispute.against._id.toString() === userId;

    if (!isParty && !isAdmin) {
      res.status(403).json({ success: false, message: 'Access denied.' });
      return;
    }

    res.status(200).json({ success: true, data: { dispute } });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/disputes/:id/status
 * @desc    Update dispute status (admin only)
 * @access  Private (admin)
 */
export const updateDisputeStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, adminNote } = req.body;

    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) {
      res.status(404).json({ success: false, message: 'Dispute not found.' });
      return;
    }

    const isAlreadyResolved = dispute.status === 'resolved';

    dispute.status = status;
    if (adminNote !== undefined) dispute.adminNote = adminNote;

    if (status === 'resolved' && !isAlreadyResolved) {
      dispute.resolvedAt = new Date();

      const order = await Order.findById(dispute.order).populate('payment');
      if (order && order.status !== 'refunded') {
        order.status = 'refunded';
        await order.save();

        let paystackResponse = undefined;
        if (order.payment && (order.payment as any).reference && (order.payment as any).status === 'success') {
          try {
            const paystackRefund = await initiateRefund(
              (order.payment as any).reference,
              order.totalAmount,
              `Refund for disputed order ${order.orderNumber}`
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
                error: paystackErr.response?.data || paystackErr.message,
              },
            });
          }
        }

        await Transaction.create({
          order: order._id,
          reference: `REFUND-${order.orderNumber}-${Date.now()}`.toUpperCase(),
          amount: order.totalAmount,
          currency: 'GHS',
          paymentMethod: (order.payment as any)?.paymentMethod || 'momo',
          status: 'refunded',
          paystackResponse,
          paidAt: new Date(),
        });

        const populatedOrder = await order.populate('seller');
        const sellerUserId = (populatedOrder.seller as any).ownerId;

        await notificationService.create(
          order.buyer.toString(),
          'order_cancelled',
          'Dispute Resolved - Refunded',
          `Your dispute on order #${order.orderNumber} was resolved in your favor and GHS ${order.totalAmount} has been refunded.`,
          `/orders/${order._id}`,
          { orderId: order._id.toString() }
        );

        if (sellerUserId) {
          await notificationService.create(
            sellerUserId.toString(),
            'order_cancelled',
            'Dispute Resolved - Order Refunded',
            `The dispute on order #${order.orderNumber} was resolved. The order has been refunded.`,
            `/seller/orders`,
            { orderId: order._id.toString() }
          );
        }

        try {
          const { app } = require('../app');
          const io = app.get('io');
          if (io) {
            io.to(`order:${order._id}`).emit('order:statusChanged', {
              orderId: order._id.toString(),
              status: 'refunded',
              updatedAt: new Date().toISOString(),
            });
          }
        } catch {}
      }
    }

    await dispute.save();

    res.status(200).json({ success: true, message: 'Dispute updated.', data: { dispute } });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/disputes (admin)
 * @desc    List all disputes
 * @access  Private (admin)
 */
export const getAllDisputes = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter: Record<string, any> = {};
    if (status) filter.status = status;

    const [disputes, total] = await Promise.all([
      Dispute.find(filter)
        .populate('order', 'orderNumber totalAmount')
        .populate('raisedBy', 'name email')
        .populate('against', 'name email')
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit)),
      Dispute.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: { disputes },
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    next(error);
  }
};
