#!/usr/bin/env node

/**
 * Price Change Detection Cron Job
 * Runs periodically to check for price changes in saved items
 * and sends notifications to users
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const NotificationService = require('../services/notification.service');
const ApiError = require('../utils/ApiError');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB for price check'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

const notificationService = new NotificationService();

/**
 * Check for price changes in saved items and send notifications
 */
async function checkPriceChanges() {
  try {
    console.log(`[${new Date().toISOString()}] Starting price change check...`);
    
    // Get all users with saved items
    const users = await User.find({ 'savedItems.0': { $exists: true } });
    
    console.log(`Found ${users.length} users with saved items`);
    
    let totalNotifications = 0;
    
    for (const user of users) {
      try {
        // Get user's saved items with product details
        const savedItems = await User.aggregate([
          { $match: { _id: user._id } },
          { $unwind: '$savedItems' },
          {
            $lookup: {
              from: 'products',
              localField: 'savedItems.productId',
              foreignField: '_id',
              as: 'product'
            }
          },
          { $unwind: '$product' },
          {
            $project: {
              _id: 0,
              userId: '$_id',
              productId: '$savedItems.productId',
              savedAt: '$savedItems.savedAt',
              priceWhenSaved: '$savedItems.priceWhenSaved',
              currentPrice: '$product.price',
              productTitle: '$product.title',
              productIdString: { $toString: '$product._id' }
            }
          }
        ]);
        
        let userNotifications = 0;
        
        // Check each saved item for price changes
        for (const item of savedItems) {
          const priceChangePercent = ((item.currentPrice - item.priceWhenSaved) / item.priceWhenSaved) * 100;
          
          // Only notify for significant changes (>5% increase or decrease)
          if (Math.abs(priceChangePercent) > 5) {
            if (priceChangePercent < 0) {
              // Price dropped
              await notificationService.notifyPriceDrop(
                item.userId.toString(),
                item.productTitle,
                item.currentPrice,
                item.priceWhenSaved,
                item.productIdString
              );
              userNotifications++;
              totalNotifications++;
              console.log(`Price drop alert sent to user ${item.userId} for ${item.productTitle}: ${priceChangePercent.toFixed(1)}%`);
            } else {
              // Price increased
              await notificationService.notifyPriceIncrease(
                item.userId.toString(),
                item.productTitle,
                item.currentPrice,
                item.priceWhenSaved,
                item.productIdString
              );
              userNotifications++;
              totalNotifications++;
              console.log(`Price increase alert sent to user ${item.userId} for ${item.productTitle}: ${priceChangePercent.toFixed(1)}%`);
            }
          }
        }
        
        if (userNotifications > 0) {
          console.log(`Sent ${userNotifications} notifications to user ${user._id}`);
        }
        
      } catch (userError) {
        console.error(`Error processing user ${user._id}:`, userError);
        // Continue with next user
      }
    }
    
    console.log(`[${new Date().toISOString()}] Price check completed. Sent ${totalNotifications} total notifications.`);
    
  } catch (error) {
    console.error('Error in price change detection:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    process.exit(0);
  }
}

// Run the check
checkPriceChanges().catch(console.error);