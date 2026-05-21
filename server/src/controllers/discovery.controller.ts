import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import Product from '../models/Product';
import ApiError from '../utils/ApiError';

/**
 * @route   GET /api/discovery/recently-viewed
 * @desc    Get user's recently viewed products
 * @access  Private
 */
export const getRecentlyViewed = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req.user!._id)
      .populate({
        path: 'recentlyViewed.productId',
        populate: {
          path: 'seller',
          select: 'name slug avatar isVerified location rating reviewCount',
        },
      });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Filter out any recently viewed products that might have been deleted
    const list = (user.recentlyViewed || [])
      .filter((item) => item.productId !== null)
      .map((item) => ({
        product: item.productId,
        viewedAt: item.viewedAt,
      }));

    res.status(200).json({
      success: true,
      message: 'Recently viewed products retrieved',
      data: list,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/discovery/saved-searches
 * @desc    Save a search query + filters
 * @access  Private
 */
export const saveSearch = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { query, category, filters, alertEnabled } = req.body;

    if (!query && !category && (!filters || Object.keys(filters).length === 0)) {
      res.status(400).json({
        success: false,
        message: 'Must provide at least a query, category, or filters to save.',
      });
      return;
    }

    const user = await User.findById(req.user!._id);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (!user.savedSearches) {
      user.savedSearches = [];
    }

    // Prevent duplicates
    const isDuplicate = user.savedSearches.some(
      (s) =>
        s.query === query &&
        s.category === category &&
        JSON.stringify(s.filters) === JSON.stringify(filters)
    );

    if (isDuplicate) {
      res.status(400).json({
        success: false,
        message: 'This search is already saved.',
      });
      return;
    }

    user.savedSearches.push({
      query: query || '',
      category: category || undefined,
      filters: filters || {},
      alertEnabled: alertEnabled !== undefined ? alertEnabled : true,
      createdAt: new Date(),
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Search saved successfully',
      data: user.savedSearches[user.savedSearches.length - 1],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/discovery/saved-searches
 * @desc    Get user's saved searches
 * @access  Private
 */
export const getSavedSearches = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req.user!._id);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    res.status(200).json({
      success: true,
      message: 'Saved searches retrieved',
      data: user.savedSearches || [],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/discovery/saved-searches/:id
 * @desc    Remove a saved search
 * @access  Private
 */
export const deleteSavedSearch = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req.user!._id);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (!user.savedSearches) {
      user.savedSearches = [];
    }

    const initialLength = user.savedSearches.length;
    user.savedSearches = user.savedSearches.filter(
      (s: any) => s._id.toString() !== req.params.id
    );

    if (user.savedSearches.length === initialLength) {
      throw ApiError.notFound('Saved search not found');
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Saved search removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/discovery/saved-searches/:id/alert
 * @desc    Toggle saved search alert notification
 * @access  Private
 */
export const toggleSavedSearchAlert = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req.user!._id);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const saved = user.savedSearches?.find(
      (s: any) => s._id.toString() === req.params.id
    );

    if (!saved) {
      throw ApiError.notFound('Saved search not found');
    }

    saved.alertEnabled = !saved.alertEnabled;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Alerts ${saved.alertEnabled ? 'enabled' : 'disabled'} for this search`,
      data: saved,
    });
  } catch (error) {
    next(error);
  }
};
