import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/campusmarketplace';

async function checkRevenue() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');
    
    // Dynamically load Order model
    const OrderSchema = new mongoose.Schema({
      totalAmount: Number,
      status: String,
    });
    const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);
    
    const revenueAgg = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } },
    ]);
    
    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;
    console.log(`TOTAL_REVENUE: GHS ${totalRevenue.toFixed(2)}`);
    
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkRevenue();
