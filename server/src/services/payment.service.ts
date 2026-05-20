import Order from '../models/Order';
import Transaction from '../models/Transaction';
import User from '../models/User';
import ApiError from '../utils/ApiError';
import {
  initializeTransaction,
  verifyTransaction,
  getPaystackChannels,
  generateReference,
} from '../utils/paystack';
import { emailService } from './email.service';
import payoutService from './payout.service';
import notificationService from './notification.service';

class PaymentService {
  /**
   * Initiate a payment for one or more orders
   */
  async initiatePayment(
    orderIds: string | string[],
    userId: string,
    paymentMethod: string,
    callbackUrl: string
  ): Promise<{ authorizationUrl: string; reference: string }> {
    const ids = Array.isArray(orderIds) ? orderIds : [orderIds];
    
    // Fetch orders
    const orders = await Order.find({ _id: { $in: ids } });
    if (orders.length === 0) throw ApiError.notFound('Orders not found');

    // Verify all orders belong to user and are pending
    let totalAmount = 0;
    for (const order of orders) {
      if (order.buyer.toString() !== userId) {
        throw ApiError.forbidden(`You do not have access to order ${order._id}`);
      }
      if (order.status !== 'pending') {
        throw ApiError.badRequest(`Order ${order.orderNumber} is no longer payable`);
      }
      totalAmount += order.totalAmount;
    }

    // Get buyer email
    const buyer = await User.findById(userId).select('email');
    if (!buyer) throw ApiError.notFound('User not found');

    // Generate reference
    const reference = generateReference();
    const channels = getPaystackChannels(paymentMethod);

    // Create transaction record
    const transaction = await Transaction.create({
      order: orders[0]._id, // Keep for legacy
      orders: orders.map(o => o._id),
      reference,
      amount: totalAmount,
      currency: 'GHS',
      paymentMethod,
      status: 'pending',
    });

    // Link transaction to all orders
    await Order.updateMany(
      { _id: { $in: ids } },
      { $set: { payment: transaction._id } }
    );

    // Initialize with Paystack
    try {
      const paystackRes = await initializeTransaction(
        buyer.email,
        totalAmount,
        reference,
        callbackUrl,
        {
          order_ids: ids.join(','),
          buyer_id: userId,
          transaction_id: transaction._id.toString()
        },
        channels
      );

      return {
        authorizationUrl: paystackRes.data.authorization_url,
        reference: paystackRes.data.reference,
      };
    } catch (error: any) {
      transaction.status = 'failed';
      await transaction.save();
      throw ApiError.internal(
        `Payment initialization failed: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Verify a payment after Paystack callback
   */
  async verifyPayment(reference: string): Promise<{
    verified: boolean;
    order: any;
    transaction: any;
  }> {
    // Find transaction
    const transaction = await Transaction.findOne({ reference });
    if (!transaction) throw ApiError.notFound('Transaction not found');

    // Already verified
    if (transaction.status === 'success') {
      const orderIds = transaction.orders && transaction.orders.length > 0 
        ? transaction.orders 
        : [transaction.order];
      const orders = await Order.find({ _id: { $in: orderIds } })
        .populate('buyer', 'name avatar phone email')
        .populate('seller', 'name avatar phone isVerified ownerId')
        .populate('items.product', 'title price images status seller')
        .populate('payment');
      return { verified: true, order: orders[0], orders, transaction } as any;
    }

    // Verify with Paystack
    try {
      const paystackRes = await verifyTransaction(reference);

      transaction.paystackResponse = paystackRes.data;

      if (paystackRes.data.status === 'success') {
        // Verify amount matches (pesewas -> GHS)
        const paidAmountGHS = paystackRes.data.amount / 100;
        if (paidAmountGHS < transaction.amount) {
          transaction.status = 'failed';
          await transaction.save();
          throw ApiError.badRequest('Payment amount mismatch');
        }

        transaction.status = 'success';
        transaction.paidAt = new Date(paystackRes.data.paid_at);
        await transaction.save();

        // Update all orders
        const orderIds = transaction.orders && transaction.orders.length > 0 
          ? transaction.orders 
          : [transaction.order];

        await Order.updateMany(
          { _id: { $in: orderIds }, status: 'pending' },
          { $set: { status: 'paid' } }
        );

        // Emit real-time payment confirmation to order rooms
        try {
          const { app } = require('../app');
          const io = app.get('io');
          if (io) {
            for (const oid of orderIds) {
              if (!oid) continue;
              io.to(`order:${oid}`).emit('order:statusChanged', {
                orderId: oid!.toString(),
                status: 'paid',
                updatedAt: new Date().toISOString(),
              });
            }
          }
        } catch {}

        // Notify and send receipts for all orders
        const populatedOrders = await Order.find({ _id: { $in: orderIds } })
          .populate('buyer', 'name avatar phone email')
          .populate('seller', 'name avatar phone isVerified ownerId')
          .populate('items.product', 'title price images status seller')
          .populate('payment');

        for (const order of populatedOrders) {
          if (order.buyer && (order.buyer as any).email) {
            emailService.sendPaymentReceiptEmail(
              (order.buyer as any).email,
              order.orderNumber,
              order.totalAmount
            ).catch(console.error);
          }

          // Trigger high-priority Paid notification to the seller user
          if (order.seller && (order.seller as any).ownerId) {
            const sellerUserId = (order.seller as any).ownerId.toString();
            notificationService.notifyOrderPaid(
              sellerUserId,
              order.orderNumber,
              order._id.toString()
            ).catch((err) => console.error('Failed to send order paid notification:', err));
          }

          // Auto-create payout record for each seller
          payoutService.createPayoutForOrder(
            order._id.toString(),
            transaction._id.toString()
          ).catch((err) => console.error('Failed to create payout:', err));
        }

        return { verified: true, order: populatedOrders[0], orders: populatedOrders, transaction } as any;
      } else {
        transaction.status = 'failed';
        await transaction.save();
        return { verified: false, order: null, transaction };
      }
    } catch (error: any) {
      if (error instanceof ApiError) throw error;
      throw ApiError.internal(`Payment verification failed: ${error.message}`);
    }
  }

  /**
   * Handle Paystack webhook event
   */
  async handleWebhook(event: string, data: Record<string, any>): Promise<void> {
    if (event === 'charge.success') {
      const reference = data.reference;
      if (!reference) return;

      const transaction = await Transaction.findOne({ reference });
      if (!transaction) return;

      if (transaction.status === 'success') return;

      transaction.status = 'success';
      transaction.paystackResponse = data;
      transaction.paidAt = new Date(data.paid_at);
      await transaction.save();

      // Update all orders
      const orderIds = transaction.orders && transaction.orders.length > 0 
        ? transaction.orders 
        : [transaction.order];

      await Order.updateMany(
        { _id: { $in: orderIds }, status: 'pending' },
        { $set: { status: 'paid' } }
      );

      const populatedOrders = await Order.find({ _id: { $in: orderIds } })
        .populate('buyer', 'email')
        .populate('seller', 'ownerId');
      
      for (const order of populatedOrders) {
        if (order.buyer && (order.buyer as any).email) {
          emailService.sendPaymentReceiptEmail(
            (order.buyer as any).email,
            order.orderNumber,
            order.totalAmount
          ).catch(console.error);
        }

        // Trigger high-priority Paid notification to the seller user
        if (order.seller && (order.seller as any).ownerId) {
          const sellerUserId = (order.seller as any).ownerId.toString();
          notificationService.notifyOrderPaid(
            sellerUserId,
            order.orderNumber,
            order._id.toString()
          ).catch((err) => console.error('Failed to send order paid notification from webhook:', err));
        }

        payoutService.createPayoutForOrder(
          order._id.toString(),
          transaction._id.toString()
        ).catch((err: any) => console.error('Failed to create payout from webhook:', err));
      }
    }

    if (event === 'charge.failed') {
      const reference = data.reference;
      if (!reference) return;

      const transaction = await Transaction.findOne({ reference });
      if (!transaction) return;

      transaction.status = 'failed';
      transaction.paystackResponse = data;
      await transaction.save();
    }
  }

  /**
   * Get transaction by reference
   */
  async getTransactionByReference(reference: string) {
    const transaction = await Transaction.findOne({ reference }).populate('order');
    if (!transaction) throw ApiError.notFound('Transaction not found');
    return transaction;
  }
}

export default new PaymentService();
