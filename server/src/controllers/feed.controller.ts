import { Request, Response, NextFunction } from 'express';
import feedService from '../services/feed.service';

/**
 * @route   GET /api/feed/pulse
 * @desc    Get discovery feed based on proximity and trends
 * @access  Private
 */
export const getPulseFeed = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id.toString();
    const residenceHall = (req.user as any).residenceHall;

    const data = await feedService.getCampusPulse(userId, residenceHall);

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};
