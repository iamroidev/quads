import mongoose from 'mongoose';
import connectDB from '../config/db';
import User from '../models/User';
import Store from '../models/Store';
import Product from '../models/Product';
import Bundle from '../models/Bundle';

const seedTestBundle = async () => {
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

    console.log(`Using Store: "${store.name}" (ID: ${store._id}) for bundles.`);

    // 3. Clear existing bundles for this seller to avoid duplicate testing entries
    const deleteResult = await Bundle.deleteMany({ seller: store._id });
    console.log(`Cleared ${deleteResult.deletedCount} existing bundles for this store.`);

    // 4. Find the two active products to bundle
    const bookProduct = await Product.findOne({ seller: store._id, title: 'Premium Test Book' });
    const chargerProduct = await Product.findOne({ seller: store._id, title: 'Universal Charger Adapter' });

    if (!bookProduct || !chargerProduct) {
      console.error('Test products not found. Please run seedTestProducts first.');
      process.exit(1);
    }

    console.log(`Bundling products:\n1. "${bookProduct.title}" (ID: ${bookProduct._id})\n2. "${chargerProduct.title}" (ID: ${chargerProduct._id})`);

    // 5. Create the bundle
    const bundle = await Bundle.create({
      seller: store._id,
      name: 'Student Starter Pack',
      productIds: [bookProduct._id, chargerProduct._id],
      discountPercent: 20, // 20% discount if both are bought together
      isActive: true,
    });

    console.log(`Created Bundle: "${bundle.name}" - Discount: ${bundle.discountPercent}%`);
    console.log('Bundle seeding successfully finished!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding bundle:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedTestBundle();
