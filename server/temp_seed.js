const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

const DEFAULT_CATEGORIES = [
  {
    name: 'Textbooks',
    slug: 'textbooks',
    icon: 'book-open',
    description: 'Academic textbooks, past questions, and study materials',
  },
  {
    name: 'Electronics',
    slug: 'electronics',
    icon: 'smartphone',
    description: 'Phones, laptops, chargers, headphones, and gadgets',
  },
  {
    name: 'Food & Drinks',
    slug: 'food-drinks',
    icon: 'utensils',
    description: 'Homemade meals, snacks, beverages, and groceries',
  },
  {
    name: 'Clothing & Fashion',
    slug: 'clothing-fashion',
    icon: 'shirt',
    description: 'Clothes, shoes, accessories, and fashion items',
  },
  {
    name: 'Services',
    slug: 'services',
    icon: 'briefcase',
    description: 'Tutoring, printing, laundry, repairs, and other services',
  },
  {
    name: 'Accommodation',
    slug: 'accommodation',
    icon: 'home',
    description: 'Hostel rooms, off-campus housing, and roommate search',
  },
  {
    name: 'Stationery',
    slug: 'stationery',
    icon: 'pen-tool',
    description: 'Pens, notebooks, calculators, and lab equipment',
  },
  {
    name: 'Sports & Fitness',
    slug: 'sports-fitness',
    icon: 'dumbbell',
    description: 'Sports equipment, gym gear, and fitness accessories',
  },
  {
    name: 'Others',
    slug: 'others',
    icon: 'package',
    description: "Everything else that doesn't fit other categories",
  },
];

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    icon: { type: String, default: 'package' },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Category = mongoose.model('Category', categorySchema);

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected.');

    console.log('Seeding categories...');
    for (const cat of DEFAULT_CATEGORIES) {
      await Category.findOneAndUpdate(
        { slug: cat.slug },
        cat,
        { upsert: true, new: true }
      );
    }
    console.log('Successfully seeded categories.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
