import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import Report from '../models/Report';
import User from '../models/User';
import ApiError from '../utils/ApiError';

const router = Router();

// POST /api/reports — submit a report
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reportedUser, reason, description, conversationId, productId } = req.body;
    if (!reportedUser || !reason || !description) {
      throw ApiError.badRequest('reportedUser, reason, and description are required.');
    }
    if (reportedUser === req.user!._id.toString()) {
      throw ApiError.badRequest('You cannot report yourself.');
    }
    const report = await Report.create({
      reporter: req.user!._id,
      reportedUser,
      reason,
      description,
      conversationId,
      productId,
    });
    res.status(201).json({ success: true, message: 'Report submitted. Our team will review it.', data: { report } });
  } catch (error) { next(error); }
});

// POST /api/reports/block/:userId — block a user
router.post('/block/:userId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    if (userId === req.user!._id.toString()) throw ApiError.badRequest('You cannot block yourself.');
    await User.findByIdAndUpdate(req.user!._id, { $addToSet: { blockedUsers: userId } });
    res.status(200).json({ success: true, message: 'User blocked.' });
  } catch (error) { next(error); }
});

// DELETE /api/reports/block/:userId — unblock a user
router.delete('/block/:userId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    await User.findByIdAndUpdate(req.user!._id, { $pull: { blockedUsers: userId } });
    res.status(200).json({ success: true, message: 'User unblocked.' });
  } catch (error) { next(error); }
});

// GET /api/reports/blocked — get blocked users list
router.get('/blocked', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user!._id).populate('blockedUsers', 'name avatar');
    res.status(200).json({ success: true, data: { blockedUsers: user?.blockedUsers || [] } });
  } catch (error) { next(error); }
});

export default router;
