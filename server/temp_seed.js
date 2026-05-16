const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

const DEFAULT_CATEGORIES = [
  { name: 'Textbooks', slug: 'textbooks', icon: 'book-open', description: 'Academic textbooks, past questions, and study materials' },
  { name: 'Electronics', slug: 'electronics', icon: 'smartphone', description: 'Phones, laptops, chargers, headphones, and gadgets' },
  { name: 'Food & Drinks', slug: 'food-drinks', icon: 'utensils', description: 'Homemade meals, snacks, beverages, and groceries' },
  { name: 'Clothing & Fashion', slug: 'clothing-fashion', icon: 'shirt', description: 'Clothes, shoes, accessories, and fashion items' },
  { name: 'Services', slug: 'services', icon: 'briefcase', description: 'Tutoring, printing, laundry, repairs, and other services' },
  { name: 'Accommodation', slug: 'accommodation', icon: 'home', description: 'Hostel rooms, off-campus housing, and roommate search' },
  { name: 'Stationery', slug: 'stationery', icon: 'pen-tool', description: 'Pens, notebooks, calculators, and lab equipment' },
  { name: 'Sports & Fitness', slug: 'sports-fitness', icon: 'dumbbell', description: 'Sports equipment, gym gear, and fitness accessories' },
  { name: 'Others', slug: 'others', icon: 'package', description: "Everything else that doesn't fit other categories" },
];

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    icon: { type: String, default: 'package' },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

const activitySchema = new mongoose.Schema({
    type: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    metadata: {
      userName: { type: String, required: true },
      productTitle: String,
      location: String,
      amount: Number,
    },
}, { timestamps: { createdAt: true, updatedAt: false } });

const Category = mongoose.model('Category', categorySchema);
const Activity = mongoose.model('Activity', activitySchema);
const User = mongoose.model('User', new mongoose.Schema({ name: String }));

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected.');

    console.log('Seeding categories...');
    for (const cat of DEFAULT_CATEGORIES) {
      await Category.findOneAndUpdate({ slug: cat.slug }, cat, { upsert: true, new: true });
    }

    // Add some mock activities if none exist
    const count = await Activity.countDocuments();
    if (count < 5) {
      console.log('Adding mock activities...');
      const admin = await User.findOne({ role: 'admin' }) || await User.findOne();
      if (admin) {
        const mockEvents = [
          { type: 'listing_created', user: admin._id, metadata: { userName: 'Sarah M.', productTitle: 'Engineering Physics Vol 2', location: 'KT Hall' } },
          { type: 'order_fulfilled', user: admin._id, metadata: { userName: 'Akwasi O.', productTitle: 'MacBook Pro 2021', amount: 8500 } },
          { type: 'coupon_created', user: admin._id, metadata: { userName: 'Flash Store', location: 'FLASH25' } },
          { type: 'listing_created', user: admin._id, metadata: { userName: 'John D.', productTitle: 'Scientific Calculator', location: 'Recognition' } },
          { type: 'order_fulfilled', user: admin._id, metadata: { userName: 'Mercy A.', productTitle: 'Dorm Fridge', amount: 1200 } },
        ];
        await Activity.insertMany(mockEvents);
      }
    }

    console.log('Successfully seeded everything.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
