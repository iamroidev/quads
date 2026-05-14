import mongoose from 'mongoose';
import Product from '../models/Product';
import Order from '../models/Order';
import Review from '../models/Review';
import User from '../models/User';

class UserService {
  /**
   * Get real-time statistics for a user (seller or buyer)
   */
  async getUserStats(userId: string) {
    const objectId = new mongoose.Types.ObjectId(userId);

    const [
      activeListings,
      totalSales,
      ratingData,
      totalOrders,
      unreadNotifications
    ] = await Promise.all([
      Product.countDocuments({ seller: objectId, status: 'active' }),
      Order.countDocuments({ seller: objectId, status: 'completed' }),
      Review.aggregate([
        { $match: { seller: objectId } },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 }
          }
        }
      ]),
      Order.countDocuments({ buyer: objectId }),
      // Mock unread notifications count for now or fetch if available
      Promise.resolve(0)
    ]);

    // Calculate response time from user record if stored
    const user = await User.findById(objectId).select('responseTimeMinutes');

    return {
      activeListings,
      totalSales,
      rating: ratingData.length > 0 ? parseFloat(ratingData[0].averageRating.toFixed(1)) : 0,
      totalReviews: ratingData.length > 0 ? ratingData[0].totalReviews : 0,
      totalOrders,
      unreadNotifications,
      responseTime: user?.responseTimeMinutes || 0,
      // For response rate, we'd need more complex logic, let's return a default or calculate
      responseRate: 100 
    };
  }
}

export default new UserService();
