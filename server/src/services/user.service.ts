import User, { IUserDocument } from '../models/User';
import notificationService from './notification.service';
import ApiError from '../utils/ApiError';
import mongoose from 'mongoose';

class UserService {
  /**
   * Follow or unfollow a seller
   */
  async toggleFollow(followerId: string, sellerId: string): Promise<{ following: boolean; followersCount: number }> {
    if (followerId === sellerId) {
      throw ApiError.badRequest('You cannot follow yourself');
    }

    const seller = await User.findById(sellerId);
    if (!seller) throw ApiError.notFound('Seller not found');

    const follower = await User.findById(followerId);
    if (!follower) throw ApiError.notFound('User not found');

    const isFollowing = follower.following.some(id => id.toString() === sellerId);

    if (isFollowing) {
      // Unfollow
      follower.following = follower.following.filter(id => id.toString() !== sellerId);
      seller.followersCount = Math.max(0, seller.followersCount - 1);
    } else {
      // Follow
      follower.following.push(new mongoose.Types.ObjectId(sellerId));
      seller.followersCount += 1;

      // Notify seller
      await notificationService.create(
        sellerId,
        'system',
        'New Follower! 👤',
        `${follower.name} started following your shop.`,
        `/sellers/${followerId}`,
        { followerId }
      );
    }

    await Promise.all([follower.save(), seller.save()]);

    return {
      following: !isFollowing,
      followersCount: seller.followersCount
    };
  }

  /**
   * Get user's followers (paginated)
   */
  async getFollowers(userId: string, page: number = 1, limit: number = 20): Promise<{ followers: any[]; pagination: any }> {
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    // Find users who are following this user
    const followers = await User.find({ following: userId })
      .select('_id name avatar isVerified')
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await User.countDocuments({ following: userId });

    return {
      followers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get who user is following (paginated)
   */
  async getFollowing(userId: string, page: number = 1, limit: number = 20): Promise<{ following: any[]; pagination: any }> {
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    // Get the IDs of users this user is following
    const followingIds = user.following || [];

    const total = followingIds.length;

    // Get paginated slice of following IDs
    const skip = (page - 1) * limit;
    const paginatedIds = followingIds.slice(skip, skip + limit);

    // Get user details for the paginated following IDs
    const following = await User.find({ _id: { $in: paginatedIds } })
      .select('_id name avatar isVerified');

    return {
      following,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Check if a user is following another user
   */
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const follower = await User.findById(followerId);
    if (!follower) return false;
    return follower.following.some(id => id.toString() === followingId);
  }

  /**
   * Get follower count for a user
   */
  async getFollowerCount(userId: string): Promise<number> {
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('User not found');
    return user.followersCount || 0;
  }

  /**
   * Get user's profile and shop stats
   */
  async getUserStats(userId: string): Promise<any> {
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    const Product = mongoose.model('Product');
    const Order = mongoose.model('Order');
    const Review = mongoose.model('Review');
    const Notification = mongoose.model('Notification');

    // 1. Active Listings (seller is userId, status is 'active')
    const activeListings = await Product.countDocuments({ 
      seller: userId, 
      status: 'active' 
    });

    // 2. Total Orders (buyer is userId)
    const totalOrders = await Order.countDocuments({ 
      buyer: userId 
    });

    // 3. Total Sales (seller is userId, status is 'completed')
    const totalSales = await Order.countDocuments({ 
      seller: userId, 
      status: 'completed' 
    });

    // 4. Rating & Reviews
    const userReviews = await Review.find({ seller: userId });
    const totalReviews = userReviews.length;
    const rating = totalReviews > 0 
      ? Number((userReviews.reduce((sum, r: any) => sum + r.rating, 0) / totalReviews).toFixed(1))
      : 5.0;

    // 5. Unread Notifications
    const unreadNotifications = await Notification.countDocuments({ 
      recipient: userId, 
      read: false 
    });

    return {
      stats: {
        activeListings,
        totalSales,
        rating,
        totalReviews,
        totalOrders,
        unreadNotifications,
        responseTime: 15,
        responseRate: 100
      }
    };
  }
}

export default new UserService();
