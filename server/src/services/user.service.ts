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
      follower.following = follower.following.filter(id => id.toString() === sellerId);
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
   * Get user performance statistics
   */
  async getUserStats(userId: string): Promise<any> {
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    // Basic stats — expand as needed
    const stats = {
      totalSales: 0,
      totalOrders: 0,
      totalListings: 0,
      followersCount: user.followersCount || 0,
      followingCount: user.following?.length || 0,
      responseTimeMinutes: user.responseTimeMinutes || 0,
    };

    return stats;
  }
}

export default new UserService();
