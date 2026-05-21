import { Request, Response } from 'express';
import { updateDisputeStatus } from '../controllers/dispute.controller';
import Dispute from '../models/Dispute';
import Order from '../models/Order';
import Transaction from '../models/Transaction';
import OpsAuditLog from '../models/OpsAuditLog';
import notificationService from '../services/notification.service';
import { initiateRefund } from '../utils/paystack';

jest.mock('../models/Dispute');
jest.mock('../models/Order');
jest.mock('../models/Transaction');
jest.mock('../models/OpsAuditLog');
jest.mock('../services/notification.service');
jest.mock('../utils/paystack');

describe('Financial Workflows - Dispute & Admin Refund System', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let nextFunction: jest.Mock;

  let mockDispute: any;
  let mockOrder: any;
  let mockPayment: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      params: { id: 'dispute-789' },
      body: {},
      user: {
        _id: 'admin-111',
        roles: ['admin'],
      } as any,
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    nextFunction = jest.fn();

    // Mock Dispute data
    mockDispute = {
      _id: 'dispute-789',
      order: 'order-123',
      status: 'open',
      raisedBy: { _id: 'buyer-001', toString: () => 'buyer-001' },
      against: { _id: 'seller-002', toString: () => 'seller-002' },
      save: jest.fn().mockResolvedValue(true),
    };

    mockPayment = {
      reference: 'PAYSTACK-REF-100',
      status: 'success',
      paymentMethod: 'momo',
    };

    // Mock Order data
    mockOrder = {
      _id: 'order-123',
      orderNumber: 'Q-445566',
      status: 'paid',
      buyer: { toString: () => 'buyer-001' },
      seller: { ownerId: 'seller-owner-id', toString: () => 'seller-002' },
      totalAmount: 200,
      payment: mockPayment,
      save: jest.fn().mockResolvedValue(true),
      populate: jest.fn().mockReturnThis(),
    };

    // Default mock setup for mongoose queries
    (Dispute.findById as jest.Mock).mockReturnValue(mockDispute);
    (Order.findById as jest.Mock).mockReturnValue(mockOrder);
    (initiateRefund as jest.Mock).mockResolvedValue({ id: 'refund-888', status: 'processed' });
  });

  it('should successfully resolve a dispute and trigger full paystack refund and transaction logs', async () => {
    mockReq.body = { status: 'resolved', adminNote: 'Approved refund' };

    await updateDisputeStatus(mockReq as Request, mockRes as Response, nextFunction);

    // 1. Dispute status updated
    expect(mockDispute.status).toBe('resolved');
    expect(mockDispute.adminNote).toBe('Approved refund');
    expect(mockDispute.resolvedAt).toBeDefined();
    expect(mockDispute.save).toHaveBeenCalled();

    // 2. Order status updated to refunded
    expect(mockOrder.status).toBe('refunded');
    expect(mockOrder.save).toHaveBeenCalled();

    // 3. Paystack refund initiated
    expect(initiateRefund).toHaveBeenCalledWith(
      'PAYSTACK-REF-100',
      200,
      'Refund for disputed order Q-445566'
    );

    // 4. Transaction created for the refund
    expect(Transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        order: 'order-123',
        amount: 200,
        currency: 'GHS',
        paymentMethod: 'momo',
        status: 'refunded',
      })
    );

    // 5. Notifications created for both buyer and seller
    expect(notificationService.create).toHaveBeenCalledWith(
      'buyer-001',
      'order_cancelled',
      'Dispute Resolved - Refunded',
      expect.stringContaining('refunded'),
      '/orders/order-123',
      expect.any(Object)
    );

    expect(notificationService.create).toHaveBeenCalledWith(
      'seller-owner-id',
      'order_cancelled',
      'Dispute Resolved - Order Refunded',
      expect.stringContaining('refunded'),
      '/seller/orders',
      expect.any(Object)
    );

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: 'Dispute updated.',
      })
    );
  });

  it('should log OpsAuditLog and continue workflow when Paystack refund fails', async () => {
    mockReq.body = { status: 'resolved' };
    const refundError = new Error('Paystack API down');
    Object.assign(refundError, { response: { data: 'Service Unavailable' } });
    (initiateRefund as jest.Mock).mockRejectedValue(refundError);

    await updateDisputeStatus(mockReq as Request, mockRes as Response, nextFunction);

    // Order status still updated to refunded
    expect(mockOrder.status).toBe('refunded');
    expect(mockOrder.save).toHaveBeenCalled();

    // Ops audit log is recorded
    expect(OpsAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'PAYMENT_REFUND_FAILED',
        details: expect.objectContaining({
          orderId: 'order-123',
          reference: 'PAYSTACK-REF-100',
        }),
      })
    );

    // Transaction still logged
    expect(Transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        order: 'order-123',
        status: 'refunded',
      })
    );

    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  it('should only update dispute status and not trigger refund logic if status is not resolved', async () => {
    mockReq.body = { status: 'under_review' };

    await updateDisputeStatus(mockReq as Request, mockRes as Response, nextFunction);

    expect(mockDispute.status).toBe('under_review');
    expect(mockDispute.save).toHaveBeenCalled();

    // Order, refund, and transaction should not be touched
    expect(mockOrder.save).not.toHaveBeenCalled();
    expect(initiateRefund).not.toHaveBeenCalled();
    expect(Transaction.create).not.toHaveBeenCalled();
    expect(notificationService.create).not.toHaveBeenCalled();

    expect(mockRes.status).toHaveBeenCalledWith(200);
  });
});
