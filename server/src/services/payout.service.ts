import Payout, { IPayoutDocument } from '../models/Payout';
import Transaction from '../models/Transaction';
import Order from '../models/Order';
import User from '../models/User';
import ApiError from '../utils/ApiError';
import env from '../config/env';
import {
  createTransferRecipient,
  initiateTransfer,
  verifyTransfer,
  generatePayoutReference,
} from '../utils/paystack';

class PayoutService {
  private readonly DEFAULT_COMMISSION = env.PLATFORM_COMMISSION || 10;

  /**
   * Auto-create a payout record when a payment is successfully verified.
   * This is called from PaymentService after payment success.
   */
  async createPayoutForOrder(orderId: string, transactionId: string): Promise<IPayoutDocument> {
    const order = await Order.findById(orderId);
    if (!order) throw ApiError.notFound('Order not found');

    const seller = await User.findById(order.seller);
    if (!seller) throw ApiError.notFound('Seller not found');

    // Check if payout already exists
    const existing = await Payout.findOne({ order: orderId });
    if (existing) return existing;

    const commissionAmount = (order.totalAmount * this.DEFAULT_COMMISSION) / 100;
    const netAmount = order.totalAmount - commissionAmount;

    const payout = await Payout.create({
      order: orderId,
      transaction: transactionId,
      seller: order.seller,
      amount: order.totalAmount,
      commissionAmount,
      platformCommission: this.DEFAULT_COMMISSION,
      netAmount,
      currency: 'GHS',
      status: 'pending',
    });

    return payout;
  }

  /**
   * Initiate a payout to the seller via Paystack Transfer API.
   * Requires the seller to have payout account details set up.
   */
  async processPayout(payoutId: string, adminUserId: string): Promise<IPayoutDocument> {
    const payout = await Payout.findById(payoutId).populate('seller', 'sellerOnboarding name email');
    if (!payout) throw ApiError.notFound('Payout not found');

    if (payout.status !== 'pending') {
      throw ApiError.badRequest(`Payout is already ${payout.status}`);
    }

    const seller = payout.seller as any;
    if (!seller.sellerOnboarding?.payoutSetupComplete) {
      throw ApiError.badRequest('Seller has not completed payout setup');
    }

    const payoutMethod = seller.sellerOnboarding.payoutMethod; // 'momo' | 'bank'
    const accountName = seller.sellerOnboarding.payoutAccountName;
    const accountNumber = seller.sellerOnboarding.payoutAccountNumber;
    const provider = seller.sellerOnboarding.payoutProvider;

    if (!accountName || !accountNumber || !provider) {
      throw ApiError.badRequest('Seller payout details are incomplete');
    }

    let type: 'nuban' | 'mobile_money' = 'nuban';
    let bankCode = provider;

    if (payoutMethod === 'momo') {
      type = 'mobile_money';
      // Map provider names to Paystack mobile money codes
      const momoCodeMap: Record<string, string> = {
        mtn: 'MTN',
        vodafone: 'VOD',
        airteltigo: 'TGO',
      };
      bankCode = momoCodeMap[provider.toLowerCase()] || provider;
    }

    const reference = generatePayoutReference();

    try {
      // Step 1: Create transfer recipient on Paystack
      const recipient = await createTransferRecipient(
        accountName,
        accountNumber,
        bankCode,
        type
      );

      payout.paystackRecipientCode = recipient.recipient_code;
      payout.status = 'processing';
      payout.processedBy = adminUserId as any;
      payout.processedAt = new Date();
      await payout.save();

      // Step 2: Initiate the transfer
      const transfer = await initiateTransfer(
        payout.netAmount,
        recipient.recipient_code,
        reference,
        `Seller payout for order - ${payout._id}`
      );

      payout.paystackTransferCode = transfer.transfer_code;
      payout.paystackTransferId = transfer.transfer_id;
      await payout.save();

      // If Paystack returns success immediately, mark as completed
      if (transfer.status === 'success') {
        payout.status = 'completed';
        payout.completedAt = new Date();
        await payout.save();
      }

      return payout;
    } catch (error: any) {
      payout.status = 'failed';
      payout.failureReason = error.response?.data?.message || error.message;
      await payout.save();
      throw ApiError.internal(`Payout failed: ${payout.failureReason}`);
    }
  }

  /**
   * Verify a payout transfer status from Paystack
   */
  async verifyPayoutStatus(payoutId: string): Promise<IPayoutDocument> {
    const payout = await Payout.findById(payoutId);
    if (!payout) throw ApiError.notFound('Payout not found');

    if (!payout.paystackTransferCode) {
      throw ApiError.badRequest('Payout has no transfer code to verify');
    }

    try {
      const result = await verifyTransfer(payout.paystackTransferCode);
      if (result.status === 'success') {
        payout.status = 'completed';
        payout.completedAt = new Date();
        await payout.save();
      } else if (result.status === 'failed') {
        payout.status = 'failed';
        payout.failureReason = 'Transfer failed on Paystack';
        await payout.save();
      }
      return payout;
    } catch (error: any) {
      throw ApiError.internal(`Transfer verification failed: ${error.message}`);
    }
  }

  /**
   * Get all payouts (admin view) with optional filters
   */
  async getPayouts(options: {
    page?: number;
    limit?: number;
    status?: string;
    sellerId?: string;
  }): Promise<{ payouts: IPayoutDocument[]; total: number; page: number; pages: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const query: Record<string, any> = {};

    if (options.status) query.status = options.status;
    if (options.sellerId) query.seller = options.sellerId;

    const total = await Payout.countDocuments(query);
    const pages = Math.ceil(total / limit);

    const payouts = await Payout.find(query)
      .populate('seller', 'name email storeName phone')
      .populate('order', 'orderNumber totalAmount')
      .populate('transaction', 'reference')
      .populate('processedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return { payouts, total, page, pages };
  }

  /**
   * Get payout stats for admin dashboard
   */
  async getPayoutStats(): Promise<{
    totalPending: number;
    totalProcessing: number;
    totalCompleted: number;
    totalFailed: number;
    totalPayoutAmount: number;
    totalCommissionEarned: number;
  }> {
    const [pending, processing, completed, failed, payouts] = await Promise.all([
      Payout.countDocuments({ status: 'pending' }),
      Payout.countDocuments({ status: 'processing' }),
      Payout.countDocuments({ status: 'completed' }),
      Payout.countDocuments({ status: 'failed' }),
      Payout.find({ status: 'completed' }),
    ]);

    const totalPayoutAmount = payouts.reduce((sum, p) => sum + p.netAmount, 0);
    const totalCommissionEarned = payouts.reduce((sum, p) => sum + p.commissionAmount, 0);

    return {
      totalPending: pending,
      totalProcessing: processing,
      totalCompleted: completed,
      totalFailed: failed,
      totalPayoutAmount,
      totalCommissionEarned,
    };
  }

  /**
   * Get payouts for a specific seller (seller view)
   */
  async getSellerPayouts(
    sellerId: string,
    options: { page?: number; limit?: number }
  ): Promise<{ payouts: IPayoutDocument[]; total: number; page: number; pages: number }> {
    return this.getPayouts({ ...options, sellerId });
  }
}

export default new PayoutService();