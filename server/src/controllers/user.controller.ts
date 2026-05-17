import { Request, Response, NextFunction } from 'express';
import userService from '../services/user.service';

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