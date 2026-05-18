import mongoose from 'mongoose';
import connectDB from '../config/db';
import User from '../models/User';
import Store from '../models/Store';
import Category from '../models/Category';
import Product from '../models/Product';

const seedTestProducts = async () => {
  try {
    await connectDB();
    console.log('Successfully connected to database.');

    // 1. Find or create Category
    let category = await Category.findOne({ slug: 'others' });
    if (!category) {
      category = await Category.findOne();
    }
    if (!category) {
      console.log('No category found, creating a default category...');
      category = await Category.create({
        name: 'Others',
        slug: 'others',
        icon: 'package',
        description: 'Everything else that doesn\'t fit other categories',
        isActive: true,
      });
      console.log('Category created:', category.name);
    } else {
      console.log('Using category:', category.name);
    }

    // 2. Find or create Test Seller User
    let sellerUser = await User.findOne({ email: 'test.seller@umat.edu.gh' });
    if (!sellerUser) {
      console.log('Creating Test Seller User...');
      sellerUser = new User({
        name: 'Test Seller',
        email: 'test.seller@umat.edu.gh',
        password: 'password123', // Will be hashed by pre-save hook
        phone: '0500000001',
        roles: ['buyer', 'seller'],
        viewMode: 'seller',
        isVerified: true,
        emailVerified: true,
        phoneVerified: true,
        isInstitutional: true,
        residenceHall: 'Kenyasi Hall',
        department: 'Computer Science',
        currentLevel: '300',
        location: 'Tarkwa Main Campus',
        bio: 'Official Test Seller account for payments.',
      });
      await sellerUser.save();
      console.log('Test Seller User created with ID:', sellerUser._id);
    } else {
      console.log('Using existing Test Seller User:', sellerUser.email);
    }

    // 3. Find or create Store for Test Seller
    let store = await Store.findOne({ ownerId: sellerUser._id });
    if (!store) {
      console.log('Creating Store for Test Seller...');
      store = await Store.create({
        ownerId: sellerUser._id,
        name: 'Test Seller Store',
        slug: 'test-seller-store',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80',
        banner: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&h=400&q=80',
        bio: 'The official sandbox store for testing payments and peer-to-peer checkouts.',
        description: 'The official sandbox store for testing payments and peer-to-peer checkouts.',
        location: 'Tarkwa Main Campus',
        phone: '0500000001',
        isVerified: true,
        payoutSetupComplete: true,
        payoutMethod: 'momo',
        payoutProvider: 'mtn',
        payoutAccountName: 'Test Seller Momo',
        payoutAccountNumber: '0500000001',
        activeListingsCount: 3,
      });
      console.log('Store created:', store.name);
      
      // Update user with active store
      sellerUser.activeStore = store._id as mongoose.Types.ObjectId;
      await sellerUser.save();
    } else {
      console.log('Using existing Store:', store.name);
    }

    // 4. Delete any existing test products by this seller to start fresh
    const deleteResult = await Product.deleteMany({ seller: store._id });
    console.log(`Cleared ${deleteResult.deletedCount} existing test products for a fresh start.`);

    // 5. Create 3 products, costing GHS 1 each
    const testProducts = [
      {
        title: 'Premium Test Book',
        description: 'An official test handbook for verifying peer-to-peer textbook purchase and GHS 1.00 checkout flow. Clean cover, zero marks.',
        price: 1.00,
        originalPrice: 20.00,
        category: category._id,
        seller: store._id,
        condition: 'like-new' as const,
        status: 'active' as const,
        deliveryOption: 'both' as const,
        pickupLocation: 'Tarkwa Main Campus Lib',
        stock: 5,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80',
            publicId: 'test_image_1',
          },
        ],
        tags: ['test', 'textbook', 'ghs1'],
      },
      {
        title: 'Universal Charger Adapter',
        description: 'A test multi-plug travel adapter for testing fast GHS 1.00 payment processing. Compatible with UK, EU, and US outlets.',
        price: 1.00,
        originalPrice: 15.00,
        category: category._id,
        seller: store._id,
        condition: 'good' as const,
        status: 'active' as const,
        deliveryOption: 'pickup' as const,
        pickupLocation: 'Kenyasi Hall Lobby',
        stock: 10,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=400&q=80',
            publicId: 'test_image_2',
          },
        ],
        tags: ['test', 'gadget', 'adapter', 'ghs1'],
      },
      {
        title: 'Chilled Student Smoothie',
        description: 'A mock refreshing strawberry banana beverage. Freshly made to test food-drinks checkout categories. Cost price: GHS 1.00.',
        price: 1.00,
        originalPrice: 5.00,
        category: category._id,
        seller: store._id,
        condition: 'new' as const,
        status: 'active' as const,
        deliveryOption: 'delivery' as const,
        pickupLocation: 'Student Center Cafeteria',
        stock: 8,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1553530979-7ee52a2670c4?auto=format&fit=crop&w=400&q=80',
            publicId: 'test_image_3',
          },
        ],
        tags: ['test', 'drink', 'smoothie', 'ghs1'],
      },
    ];

    for (const prodData of testProducts) {
      const product = await Product.create(prodData);
      console.log(`Created product: "${product.title}" - Price: GHS ${product.price}`);
    }

    console.log('Seeding completed successfully!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding test products:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedTestProducts();
