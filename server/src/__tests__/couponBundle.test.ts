import { Request, Response } from 'express';
import {
  createCoupon,
  getSellerCoupons,
  deleteCoupon,
  toggleCouponStatus,
  createBundle,
  getSellerBundles,
  deleteBundle,
  toggleBundleStatus,
} from '../controllers/order.controller';
import orderService from '../services/order.service';

jest.mock('../services/order.service');

describe('Seller Growth Toolkit - Coupons & Bundles CRUD Controllers', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      user: {
        _id: 'seller-user-123',
        activeStore: { _id: 'store-abc' },
        roles: ['seller'],
      } as any,
      body: {},
      params: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    nextFunction = jest.fn();
  });

  describe('Coupon Controller Actions', () => {
    it('should create a coupon successfully', async () => {
      mockReq.body = { code: 'SAVE10', type: 'percentage', value: 10 };
      const mockCoupon = { _id: 'coupon-1', code: 'SAVE10', seller: 'store-abc' };
      (orderService.createCoupon as jest.Mock).mockResolvedValue(mockCoupon);

      await createCoupon(mockReq as Request, mockRes as Response, nextFunction);

      expect(orderService.createCoupon).toHaveBeenCalledWith('store-abc', mockReq.body);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Coupon created',
        data: { coupon: mockCoupon },
      });
    });

    it('should delete a coupon successfully', async () => {
      mockReq.params = { id: 'coupon-1' };
      const mockCoupon = { _id: 'coupon-1', code: 'SAVE10' };
      (orderService.deleteCoupon as jest.Mock).mockResolvedValue(mockCoupon);

      await deleteCoupon(mockReq as Request, mockRes as Response, nextFunction);

      expect(orderService.deleteCoupon).toHaveBeenCalledWith('store-abc', 'coupon-1');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Coupon deleted',
        data: { coupon: mockCoupon },
      });
    });

    it('should toggle coupon status successfully', async () => {
      mockReq.params = { id: 'coupon-1' };
      const mockCoupon = { _id: 'coupon-1', isActive: false };
      (orderService.toggleCouponStatus as jest.Mock).mockResolvedValue(mockCoupon);

      await toggleCouponStatus(mockReq as Request, mockRes as Response, nextFunction);

      expect(orderService.toggleCouponStatus).toHaveBeenCalledWith('store-abc', 'coupon-1');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Coupon status toggled',
        data: { coupon: mockCoupon },
      });
    });
  });

  describe('Bundle Controller Actions', () => {
    it('should create a bundle successfully', async () => {
      mockReq.body = { name: 'Super Saver Bundle', productIds: ['prod1', 'prod2'], discountPercent: 15 };
      const mockBundle = { _id: 'bundle-1', name: 'Super Saver Bundle' };
      (orderService.createBundle as jest.Mock).mockResolvedValue(mockBundle);

      await createBundle(mockReq as Request, mockRes as Response, nextFunction);

      expect(orderService.createBundle).toHaveBeenCalledWith('store-abc', mockReq.body);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Bundle created',
        data: { bundle: mockBundle },
      });
    });

    it('should delete a bundle successfully', async () => {
      mockReq.params = { id: 'bundle-1' };
      const mockBundle = { _id: 'bundle-1', name: 'Super Saver Bundle' };
      (orderService.deleteBundle as jest.Mock).mockResolvedValue(mockBundle);

      await deleteBundle(mockReq as Request, mockRes as Response, nextFunction);

      expect(orderService.deleteBundle).toHaveBeenCalledWith('store-abc', 'bundle-1');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Bundle deleted',
        data: { bundle: mockBundle },
      });
    });

    it('should toggle bundle status successfully', async () => {
      mockReq.params = { id: 'bundle-1' };
      const mockBundle = { _id: 'bundle-1', isActive: false };
      (orderService.toggleBundleStatus as jest.Mock).mockResolvedValue(mockBundle);

      await toggleBundleStatus(mockReq as Request, mockRes as Response, nextFunction);

      expect(orderService.toggleBundleStatus).toHaveBeenCalledWith('store-abc', 'bundle-1');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Bundle status toggled',
        data: { bundle: mockBundle },
      });
    });
  });
});
