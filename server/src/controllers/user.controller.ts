import { Request, Response, NextFunction } from 'express';
import userService from '../services/user.service';
import User from '../models/User';
import Store from '../models/Store';
import Order from '../models/Order';
import Review from '../models/Review';
import BuyerRating from '../models/BuyerRating';

/**
 * @route   POST /api/users/follow/:userId
 * @desc    Toggle follow/unfollow a user
 * @access  Private
 */
export const toggleFollow = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await userService.toggleFollow(
      req.user!._id.toString(),
      req.params.userId
    );

    res.status(200).json({
      success: true,
      message: result.following ? 'Now following user' : 'Unfollowed user',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/users/:userId/followers
 * @desc    Get user's followers
 * @access  Private
 */
export const getFollowers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page, limit } = req.query;
    const result = await userService.getFollowers(
      req.params.userId,
      parseInt(page as string) || 1,
      parseInt(limit as string) || 20
    );

    res.status(200).json({
      success: true,
      data: { followers: result.followers },
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/users/:userId/following
 * @desc    Get who user is following
 * @access  Private
 */
export const getFollowing = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page, limit } = req.query;
    const result = await userService.getFollowing(
      req.params.userId,
      parseInt(page as string) || 1,
      parseInt(limit as string) || 20
    );

    res.status(200).json({
      success: true,
      data: { following: result.following },
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/users/:userId/stats
 * @desc    Get user statistics
 * @access  Private
 */
export const getUserStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const stats = await userService.getUserStats(req.params.userId);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/users/data-export
 * @desc    Export all user data (GDPR-style)
 * @access  Private
 */
export const exportUserData = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id.toString();

    // 1. Fetch user profile
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // 2. Fetch stores owned by this user
    const stores = await Store.find({ ownerId: userId });

    // 3. Fetch orders (where user is buyer, or seller matches user's store ID or user ID)
    const storeIds = stores.map(s => s._id);
    const orders = await Order.find({
      $or: [
        { buyer: userId },
        { seller: { $in: storeIds } }
      ]
    });

    // 4. Fetch reviews (written by user, or written for user's store)
    const reviewsWritten = await Review.find({ reviewer: userId });
    const reviewsReceived = await Review.find({ seller: { $in: storeIds } });

    // 5. Fetch buyer ratings (written for this user, or written by this user)
    const buyerRatingsReceived = await BuyerRating.find({ buyer: userId });
    const buyerRatingsWritten = await BuyerRating.find({ seller: userId });

    const exportData = {
      exportedAt: new Date().toISOString(),
      profile: user,
      stores,
      orders,
      reviews: {
        written: reviewsWritten,
        received: reviewsReceived
      },
      buyerRatings: {
        written: buyerRatingsWritten,
        received: buyerRatingsReceived
      }
    };

    res.setHeader('Content-disposition', `attachment; filename=quads-data-export-${userId}.json`);
    res.setHeader('Content-type', 'application/json');
    res.status(200).send(JSON.stringify(exportData, null, 2));
  } catch (error) {
    next(error);
  }
};