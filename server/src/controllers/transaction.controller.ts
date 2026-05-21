import { Request, Response, NextFunction } from 'express';
import Transaction from '../models/Transaction';
import Order from '../models/Order';
import ApiError from '../utils/ApiError';

/**
 * @route   GET /api/transactions/my
 * @desc    Get current user's (buyer's) transaction history
 * @access  Private
 */
export const getMyTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    // Find all orders where the user is the buyer
    const userOrders = await Order.find({ buyer: userId }).select('_id');
    const orderIds = userOrders.map((o) => o._id);

    const filter = {
      $or: [
        { order: { $in: orderIds } },
        { orders: { $in: orderIds } },
      ],
    };

    const total = await Transaction.countDocuments(filter);
    const transactions = await Transaction.find(filter)
      .populate({
        path: 'order',
        select: 'orderNumber status totalAmount',
        populate: { path: 'seller', select: 'name' }
      })
      .populate({
        path: 'orders',
        select: 'orderNumber status totalAmount',
        populate: { path: 'seller', select: 'name' }
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: { transactions },
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/transactions/:id
 * @desc    Get single transaction details
 * @access  Private
 */
export const getTransactionDetail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id.toString();
    const transaction = await Transaction.findById(req.params.id)
      .populate({
        path: 'order',
        populate: { path: 'seller', select: 'name' }
      })
      .populate({
        path: 'orders',
        populate: { path: 'seller', select: 'name' }
      });

    if (!transaction) {
      throw ApiError.notFound('Transaction not found');
    }

    // Verify ownership: check if any associated orders belong to the user
    const orderIds = transaction.orders && transaction.orders.length > 0
      ? transaction.orders
      : [transaction.order];

    const orders = await Order.find({ _id: { $in: orderIds } });
    const isOwner = orders.some(o => o.buyer.toString() === userId || o.seller.toString() === userId);
    const isAdmin = req.user!.roles.includes('admin');

    if (!isOwner && !isAdmin) {
      throw ApiError.forbidden('Access denied');
    }

    res.status(200).json({
      success: true,
      data: { transaction },
    });
  } catch (error) {
    next(error);
  }
};
