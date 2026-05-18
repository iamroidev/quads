import mongoose from 'mongoose';
import connectDB from '../config/db';
import User from '../models/User';
import Store from '../models/Store';
import Coupon from '../models/Coupon';

const seedTestCoupons = async () => {
  try {
    await connectDB();
    console.log('Successfully connected to database.');

    // 1. Locate sandbox Test Seller User
    const sellerUser = await User.findOne({ email: 'test.seller@umat.edu.gh' });
    if (!sellerUser) {
      console.error('Test Seller User not found. Please run seedTestProducts first.');
      process.exit(1);
    }

    // 2. Locate active store
    const store = await Store.findOne({ ownerId: sellerUser._id });
    if (!store) {
      console.error('Test Seller Store not found. Please run seedTestProducts first.');
      process.exit(1);
    }

    console.log(`Using Store: "${store.name}" (ID: ${store._id}) for coupons.`);

    // 3. Clear existing coupons for this seller to avoid duplicate key index conflicts
    const deleteResult = await Coupon.deleteMany({ seller: store._id });
    console.log(`Cleared ${deleteResult.deletedCount} existing coupons for this store.`);

    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + 30); // 30 days from now

    // 4. Define the 2 sandboxed coupons
    const couponsToSeed = [
      {
        code: 'TEST50',
        seller: store._id,
        type: 'percentage' as const,
        value: 50, // 50% discount
        minOrderAmount: 0,
        usageLimit: 100,
        usedCount: 0,
        isActive: true,
        startsAt: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Active since yesterday
        expiresAt: futureDate,
      },
      {
        code: 'SAVE1',
        seller: store._id,
        type: 'fixed' as const,
        value: 1.00, // GHS 1.00 off
        minOrderAmount: 1.00,
        usageLimit: 100,
        usedCount: 0,
        isActive: true,
        startsAt: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Active since yesterday
        expiresAt: futureDate,
      }
    ];

    // 5. Seed Coupons
    for (const couponData of couponsToSeed) {
      const coupon = await Coupon.create(couponData);
      console.log(`Created Coupon: "${coupon.code}" - Type: ${coupon.type} - Value: ${coupon.value}`);
    }

    console.log('Coupon seeding successfully finished!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding coupons:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedTestCoupons();
