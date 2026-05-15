import Product, { IProductDocument } from '../models/Product';
import Order from '../models/Order';
import mongoose from 'mongoose';

class FeedService {
  /**
   * Get the "Campus Pulse" Discovery Feed
   */
  async getCampusPulse(userId: string, residenceHall?: string) {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get user and their following
    const User = mongoose.model('User');
    const user = await User.findById(userId).select('following residenceHall');
    const followingIds = user?.following || [];

    // Get sellers on vacation
    const vacationingSellers = await User.find({ 'vacationMode.active': true }).distinct('_id');
    const excludeSellers = [...vacationingSellers];

    // 0. From Sellers You Follow
    const fromFollowing = await Product.find({
      status: 'active',
      seller: { $in: followingIds, $nin: excludeSellers }
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('seller', 'name avatar isVerified');

    // 1. Trending Items
    const trending = await Product.find({
      status: 'active',
      seller: { $nin: excludeSellers },
      $or: [
        { views: { $gt: 10 } },
        { isFeatured: true }
      ]
    })
    .sort({ views: -1, createdAt: -1 })
    .limit(10)
    .populate('seller', 'name avatar isVerified');

    // 2. Near You (Same Residence Hall)
    let nearYou: IProductDocument[] = [];
    if (residenceHall) {
      nearYou = await Product.find({
        status: 'active',
        seller: { $nin: excludeSellers },
        pickupLocation: residenceHall,
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('seller', 'name avatar isVerified');
    }

    // 3. New Arrivals (Fresh listings)
    const newArrivals = await Product.find({
      status: 'active',
      seller: { $nin: excludeSellers },
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('seller', 'name avatar isVerified');

    // Filter out duplicates and own products
    const seen = new Set();
    const allItems = [...nearYou, ...trending, ...newArrivals]
      .filter(item => {
        if (item.seller?._id?.toString() === userId) return false;
        if (seen.has(item._id.toString())) return false;
        seen.add(item._id.toString());
        return true;
      });

    return {
      pulse: allItems.slice(0, 30),
      sections: {
        fromFollowing: fromFollowing.slice(0, 8),
        nearYou: nearYou.slice(0, 8),
        trending: trending.slice(0, 8),
        newArrivals: newArrivals.slice(0, 8)
      }
    };
  }
}

export default new FeedService();
