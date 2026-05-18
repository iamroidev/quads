import mongoose from 'mongoose';
import connectDB from '../config/db';
import User from '../models/User';
import Store from '../models/Store';
import Product from '../models/Product';
import Coupon from '../models/Coupon';
import Bundle from '../models/Bundle';

const cleanTestData = async () => {
  try {
    await connectDB();
    console.log('Successfully connected to database for cleanup.');

    // 1. Locate sandbox Test Seller User
    const sellerUser = await User.findOne({ email: 'test.seller@umat.edu.gh' });
    if (!sellerUser) {
      console.log('No test seller user (test.seller@umat.edu.gh) found. DB is already clean of test user!');
    } else {
      // 2. Locate active store for test seller
      const store = await Store.findOne({ ownerId: sellerUser._id });
      if (store) {
        // Delete all Products associated with this store
        const productsDeleted = await Product.deleteMany({ seller: store._id });
        console.log(`🧹 Deleted ${productsDeleted.deletedCount} test products.`);

        // Delete all Coupons associated with this store
        const couponsDeleted = await Coupon.deleteMany({ seller: store._id });
        console.log(`🧹 Deleted ${couponsDeleted.deletedCount} test coupons.`);

        // Delete all Bundles associated with this store
        const bundlesDeleted = await Bundle.deleteMany({ seller: store._id });
        console.log(`🧹 Deleted ${bundlesDeleted.deletedCount} test bundles.`);

        // Delete the Store itself
        await Store.deleteOne({ _id: store._id });
        console.log(`🧹 Deleted test store "${store.name}".`);
      } else {
        console.log('No test store found for this test user.');
      }

      // Delete the User itself
      await User.deleteOne({ _id: sellerUser._id });
      console.log(`🧹 Deleted test seller user "${sellerUser.name}" (${sellerUser.email}).`);
    }

    console.log('🎉 Cleanup successfully completed! All payment sandbox test data has been permanently deleted.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error during cleanup:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

cleanTestData();
