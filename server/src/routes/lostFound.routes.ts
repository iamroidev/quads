import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import LostFound from '../models/LostFound';
import ApiError from '../utils/ApiError';

const router = Router();

/**
 * @route   GET /api/lost-found
 * @desc    Get all lost and found items (with filtering)
 * @access  Public
 */
router.get('/', async (req, res, next) => {
  try {
    const { type, category } = req.query;
    const query: Record<string, any> = {};

    if (type && ['lost', 'found'].includes(type as string)) {
      query.type = type;
    }
    if (category) {
      query.category = category;
    }

    const items = await LostFound.find(query)
      .sort({ createdAt: -1 })
      .populate('userId', 'name avatar isVerified');

    res.status(200).json({
      success: true,
      data: items,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/lost-found
 * @desc    Pin a new lost or found item
 * @access  Private
 */
router.post('/', authenticate, async (req: any, res: any, next: any) => {
  try {
    const { type, title, category, date, location, description, contactName, contactInfo, imageUrl } = req.body;

    if (!type || !title || !category || !date || !location || !description || !contactName || !contactInfo) {
      throw ApiError.badRequest('Please fill in all required fields');
    }

    const newItem = await LostFound.create({
      type,
      title,
      category,
      date: new Date(date),
      location,
      description,
      contactName,
      contactInfo,
      imageUrl,
      userId: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Item pinned successfully!',
      data: newItem,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/lost-found/:id
 * @desc    Unpin/delete a lost or found item
 * @access  Private (Owner or Admin only)
 */
router.delete('/:id', authenticate, async (req: any, res: any, next: any) => {
  try {
    const item = await LostFound.findById(req.params.id);

    if (!item) {
      throw ApiError.notFound('Item not found');
    }

    const isOwner = item.userId && item.userId.toString() === req.user._id.toString();
    const isAdmin = req.user.roles && req.user.roles.includes('admin');

    if (!isOwner && !isAdmin) {
      throw ApiError.forbidden('You do not have permission to unpin this item');
    }

    await item.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Item unpinned successfully!',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
