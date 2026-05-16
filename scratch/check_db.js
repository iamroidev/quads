const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://quads:quadsmarketplace2026@quads.gdeh2r1.mongodb.net/?appName=QUADS';

async function checkCategories() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected.');

    const CategorySchema = new mongoose.Schema({}, { strict: false });
    const Category = mongoose.model('Category', CategorySchema);

    const categories = await Category.find({});
    console.log(`Found ${categories.length} categories:`);
    
    categories.forEach(cat => {
      console.log(`- ${cat.name || 'Unnamed'} (${cat.slug || 'no-slug'})`);
    });

    const ProductSchema = new mongoose.Schema({}, { strict: false });
    const Product = mongoose.model('Product', ProductSchema);
    const productCount = await Product.countDocuments({});
    console.log(`\nTotal Products: ${productCount}`);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkCategories();
