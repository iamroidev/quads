import { Request, Response, NextFunction } from 'express';
import Order from '../models/Order';
import Store from '../models/Store';
import BuyerRating from '../models/BuyerRating';
import ApiError from '../utils/ApiError';

/**
 * @route   POST /api/buyer-ratings
 * @desc    Seller rates a buyer after order completion
 * @access  Private (seller)
 */
export const createBuyerRating = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { orderId, rating, comment } = req.body;

    if (!orderId || !rating) {
      throw ApiError.badRequest('OrderId and rating are required');
    }

    const order = await Order.findById(orderId);
    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    if (order.status !== 'completed') {
      throw ApiError.badRequest('Only completed orders can be rated');
    }

    // Verify req.user._id is the owner of the store (order.seller)
    const store = await Store.findById(order.seller);
    if (!store) {
      throw ApiError.notFound('Associated store not found');
    }

    const isSellerOwner = store.ownerId.toString() === req.user!._id.toString();
    if (!isSellerOwner && !req.user!.roles.includes('admin')) {
      throw ApiError.forbidden('Only the order seller can rate this buyer');
    }

    // Check if rating already exists
    const existingRating = await BuyerRating.findOne({ order: orderId });
    if (existingRating) {
      throw ApiError.badRequest('You have already rated this buyer for this order');
    }

    const buyerRating = await BuyerRating.create({
      order: orderId,
      buyer: order.buyer,
      seller: req.user!._id,
      rating,
      comment: comment || '',
    });

    res.status(201).json({
      success: true,
      message: 'Buyer rating submitted successfully',
      data: { buyerRating },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/buyer-ratings/:buyerId
 * @desc    Get average rating and details for a buyer
 * @access  Public
 */
export const getBuyerRating = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { buyerId } = req.params;

    const ratings = await BuyerRating.find({ buyer: buyerId })
      .populate('seller', 'name avatar')
      .sort({ createdAt: -1 });

    const totalRatings = ratings.length;
    let averageRating = 0;

    if (totalRatings > 0) {
      const sum = ratings.reduce((acc, curr) => acc + curr.rating, 0);
      averageRating = parseFloat((sum / totalRatings).toFixed(1));
    }

    res.status(200).json({
      success: true,
      data: {
        buyerId,
        averageRating,
        totalRatings,
        ratings,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/buyer-ratings/order/:orderId
 * @desc    Check if an order has been rated by the seller
 * @access  Private
 */
export const getOrderBuyerRating = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { orderId } = req.params;

    const rating = await BuyerRating.findOne({ order: orderId });

    res.status(200).json({
      success: true,
      data: {
        rated: !!rating,
        rating: rating || null,
      },
    });
  } catch (error) {
    next(error);
  }
};
