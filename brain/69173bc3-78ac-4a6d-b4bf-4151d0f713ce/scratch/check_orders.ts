import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/quads';

async function checkOrders() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');
    
    // Dynamically load Order model
    const OrderSchema = new mongoose.Schema({
      totalAmount: Number,
      status: String,
    });
    const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);
    
    const allOrders = await Order.find({});
    console.log(`TOTAL_ORDERS: ${allOrders.length}`);
    allOrders.forEach(o => {
        console.log(`Order: ${o._id}, Status: ${o.status}, Amount: ${o.totalAmount}`);
    });
    
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkOrders();
