import { Router, Request, Response, NextFunction } from 'express';
import Store from '../models/Store';
import Product from '../models/Product';
import Review from '../models/Review';
import ApiError from '../utils/ApiError';

const router = Router();

// GET /api/stores/:slug — public storefront
router.get('/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const store = await Store.findOne({ slug: req.params.slug }).populate('ownerId', 'name avatar responseTimeMinutes createdAt');
    if (!store) throw ApiError.notFound('Store not found.');

    const [products, reviews, ratingAgg] = await Promise.all([
      Product.find({ seller: store._id, status: 'active' })
        .sort({ createdAt: -1 })
        .limit(50)
        .select('title price images condition status deliveryOption pickupLocation views isFeatured createdAt'),
      Review.find({ seller: store.ownerId })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('reviewer', 'name avatar'),
      Review.aggregate([
        { $match: { seller: store.ownerId } },
        { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]),
    ]);

    const rating = ratingAgg[0] || { avg: 0, count: 0 };

    res.status(200).json({
      success: true,
      data: {
        store: {
          ...store.toObject(),
          rating: { average: rating.avg || 0, total: rating.count || 0 },
        },
        products,
        reviews,
      },
    });
  } catch (error) { next(error); }
});

export default router;
