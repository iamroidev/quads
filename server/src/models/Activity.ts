import mongoose, { Document, Schema } from 'mongoose';

export interface IActivityDocument extends Document {
  type: 'listing_created' | 'order_fulfilled' | 'user_verified' | 'coupon_created';
  user: mongoose.Types.ObjectId;
  product?: mongoose.Types.ObjectId;
  order?: mongoose.Types.ObjectId;
  metadata: {
    userName: string;
    productTitle?: string;
    location?: string;
    amount?: number;
  };
  createdAt: Date;
}

const activitySchema = new Schema<IActivityDocument>(
  {
    type: {
      type: String,
      required: true,
      enum: ['listing_created', 'order_fulfilled', 'user_verified', 'coupon_created'],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
    },
    metadata: {
      userName: { type: String, required: true },
      productTitle: String,
      location: String,
      amount: Number,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Index for fast retrieval of recent activities
activitySchema.index({ createdAt: -1 });

const Activity = mongoose.model<IActivityDocument>('Activity', activitySchema);

export default Activity;
