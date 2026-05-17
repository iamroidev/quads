import OrderService from '../services/order.service';
import Order from '../models/Order';
import notificationService from '../services/notification.service';
import Product from '../models/Product';
import ApiError from '../utils/ApiError';

jest.mock('../models/Order');
jest.mock('../services/notification.service');
jest.mock('../models/Product');

describe('OrderService - Secure Escrow QR Handoff Engine', () => {
  let mockOrder: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup standard mock order document
    mockOrder = {
      _id: 'order-123',
      orderNumber: 'Q-998877',
      buyer: {
        _id: '507f1f77bcf86cd799439011',
        toString: () => '507f1f77bcf86cd799439011',
      },
      seller: {
        _id: 'seller-id',
        ownerId: '507f1f77bcf86cd799439012',
        name: 'UMaT Gadgets',
        toString: () => 'seller-id',
      },
      items: [
        {
          product: 'prod-88',
          title: 'UMaT Hoodie',
          price: 150,
          quantity: 1,
        },
      ],
      totalAmount: 150,
      deliveryMethod: 'pickup',
      handoffCode: '776655',
      handoffStatus: 'pending',
      status: 'paid',
      save: jest.fn().mockResolvedValue(true),
      populate: jest.fn().mockReturnThis(),
      toObject: jest.fn().mockImplementation(function (this: any) {
        return {
          _id: this._id,
          orderNumber: this.orderNumber,
          buyer: this.buyer,
          seller: this.seller,
          items: this.items,
          totalAmount: this.totalAmount,
          deliveryMethod: this.deliveryMethod,
          handoffCode: this.handoffCode,
          handoffStatus: this.handoffStatus,
          status: this.status,
        };
      }),
    };
  });

  describe('verifyHandoff', () => {
    it('should throw 404 if order does not exist', async () => {
      (Order.findById as jest.Mock).mockReturnValue(null);

      await expect(
        OrderService.verifyHandoff('non-existent', '507f1f77bcf86cd799439011', '776655')
      ).rejects.toThrow(ApiError);
      
      try {
        await OrderService.verifyHandoff('non-existent', '507f1f77bcf86cd799439011', '776655');
      } catch (err: any) {
        expect(err.statusCode).toBe(404);
        expect(err.message).toBe('Order not found');
      }
    });

    it('should throw 403 if the user trying to verify is not the buyer', async () => {
      (Order.findById as jest.Mock).mockReturnValue(mockOrder);

      await expect(
        OrderService.verifyHandoff('order-123', 'unauthorized-user', '776655')
      ).rejects.toThrow(ApiError);

      try {
        await OrderService.verifyHandoff('order-123', 'unauthorized-user', '776655');
      } catch (err: any) {
        expect(err.statusCode).toBe(403);
        expect(err.message).toBe('Only the buyer can verify the handoff');
      }
    });

    it('should throw 400 if the order delivery method is not pickup', async () => {
      mockOrder.deliveryMethod = 'delivery';
      (Order.findById as jest.Mock).mockReturnValue(mockOrder);

      await expect(
        OrderService.verifyHandoff('order-123', '507f1f77bcf86cd799439011', '776655')
      ).rejects.toThrow(ApiError);

      try {
        await OrderService.verifyHandoff('order-123', '507f1f77bcf86cd799439011', '776655');
      } catch (err: any) {
        expect(err.statusCode).toBe(400);
        expect(err.message).toBe('This order is not for pickup');
      }
    });

    it('should throw 400 if the handoff code does not match', async () => {
      (Order.findById as jest.Mock).mockReturnValue(mockOrder);

      await expect(
        OrderService.verifyHandoff('order-123', '507f1f77bcf86cd799439011', 'wrong-code')
      ).rejects.toThrow(ApiError);

      try {
        await OrderService.verifyHandoff('order-123', '507f1f77bcf86cd799439011', 'wrong-code');
      } catch (err: any) {
        expect(err.statusCode).toBe(400);
        expect(err.message).toBe('Invalid handoff code');
      }
    });

    it('should successfully release escrow funds, mark completed, and trigger seller notifications', async () => {
      (Order.findById as jest.Mock).mockReturnValue(mockOrder);

      const result = await OrderService.verifyHandoff('order-123', '507f1f77bcf86cd799439011', '776655');

      expect(mockOrder.handoffStatus).toBe('verified');
      expect(mockOrder.status).toBe('completed');
      expect(mockOrder.completedAt).toBeDefined();
      expect(mockOrder.save).toHaveBeenCalled();
      
      expect(notificationService.create).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439012',
        'handoff_verified',
        'Order Completed! 💰',
        expect.stringContaining('verified'),
        expect.any(String),
        expect.any(Object)
      );
    });
  });



  describe('updateOrderStatus controls', () => {
    it('should throw 403 when non-seller attempts status update', async () => {
      (Order.findById as jest.Mock).mockReturnValue(mockOrder);

      await expect(
        OrderService.updateOrderStatus('order-123', 'intruder-user', 'confirmed')
      ).rejects.toMatchObject({
        statusCode: 403,
        message: 'Only the seller can update order status',
      });
    });

    it('should throw 400 for invalid status transition', async () => {
      mockOrder.status = 'paid';
      (Order.findById as jest.Mock).mockReturnValue(mockOrder);

      await expect(
        OrderService.updateOrderStatus('order-123', '507f1f77bcf86cd799439012', 'ready')
      ).rejects.toMatchObject({
        statusCode: 400,
        message: expect.stringContaining('Cannot transition from "paid" to "ready"'),
      });
    });

    it('should allow seller to cancel and restore product listing status', async () => {
      mockOrder.status = 'paid';
      mockOrder.items = [
        { product: 'prod-88', title: 'UMaT Hoodie', quantity: 1 },
        { product: 'prod-99', title: 'UMaT Cap', quantity: 1 },
      ];
      (Order.findById as jest.Mock).mockReturnValue(mockOrder);
      (Product.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      await OrderService.updateOrderStatus('order-123', '507f1f77bcf86cd799439012', 'cancelled');

      expect(mockOrder.status).toBe('cancelled');
      expect(mockOrder.cancelledBy).toBeDefined();
      expect(Product.findByIdAndUpdate).toHaveBeenCalledWith('prod-88', { status: 'active' });
      expect(Product.findByIdAndUpdate).toHaveBeenCalledWith('prod-99', { status: 'active' });
      expect(mockOrder.save).toHaveBeenCalled();
    });
  });

  describe('cancelOrder flow', () => {
    it('should throw 403 for unrelated users', async () => {
      (Order.findById as jest.Mock).mockReturnValue(mockOrder);

      await expect(
        OrderService.cancelOrder('order-123', 'random-user')
      ).rejects.toMatchObject({
        statusCode: 403,
        message: 'You do not have access to this order',
      });
    });

    it('should reject seller cancellation for non-cancellable statuses', async () => {
      mockOrder.status = 'pending';
      (Order.findById as jest.Mock).mockReturnValue(mockOrder);

      await expect(
        OrderService.cancelOrder('order-123', '507f1f77bcf86cd799439012')
      ).rejects.toMatchObject({
        statusCode: 400,
        message: 'This order can no longer be cancelled',
      });
    });

    it('should allow buyer cancellation and apply default reason when missing', async () => {
      mockOrder.status = 'paid';
      (Order.findById as jest.Mock).mockReturnValue(mockOrder);
      (Product.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      await OrderService.cancelOrder('order-123', '507f1f77bcf86cd799439011');

      expect(mockOrder.status).toBe('cancelled');
      expect(mockOrder.cancelReason).toBe('No reason provided');
      expect(mockOrder.cancelledBy).toBeDefined();
      expect(Product.findByIdAndUpdate).toHaveBeenCalledWith('prod-88', { status: 'active' });
      expect(mockOrder.save).toHaveBeenCalled();
    });
  });

  describe('getOrderById access variants', () => {
    it('should preserve handoff code for admin users', async () => {
      (Order.findById as jest.Mock).mockReturnValue(mockOrder);

      const result = await OrderService.getOrderById('order-123', '507f1f77bcf86cd799439011', true);

      expect(result.handoffCode).toBe('776655');
    });
  });

  describe('getOrderById Secure Privacy Controls', () => {
    it('should hide the secure handoff code from the buyer to prevent escrow cheating', async () => {
      (Order.findById as jest.Mock).mockReturnValue(mockOrder);

      // Act: Get order as buyer
      const result = await OrderService.getOrderById('order-123', '507f1f77bcf86cd799439011');

      // Assert: handoffCode is completely stripped
      expect(result.handoffCode).toBeUndefined();
    });

    it('should show the secure handoff code to the seller so they can render the validation QR code', async () => {
      (Order.findById as jest.Mock).mockReturnValue(mockOrder);

      // Act: Get order as seller (ownerId)
      const result = await OrderService.getOrderById('order-123', '507f1f77bcf86cd799439012');

      // Assert: handoffCode is preserved for the seller
      expect(result.handoffCode).toBe('776655');
    });

    it('should throw 403 if an unrelated student tries to fetch the order details', async () => {
      (Order.findById as jest.Mock).mockReturnValue(mockOrder);

      await expect(
        OrderService.getOrderById('order-123', 'snooping-student')
      ).rejects.toThrow(ApiError);
    });
  });
});
