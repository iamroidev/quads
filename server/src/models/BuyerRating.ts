import mongoose, { Document, Schema } from 'mongoose';

export interface IBuyerRatingDocument extends Document {
  _id: mongoose.Types.ObjectId;
  order: mongoose.Types.ObjectId;
  buyer: mongoose.Types.ObjectId;
  seller: mongoose.Types.ObjectId; // the rater
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const buyerRatingSchema = new Schema<IBuyerRatingDocument>(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    buyer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    seller: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// One rating per order
buyerRatingSchema.index({ order: 1 }, { unique: true });
buyerRatingSchema.index({ buyer: 1, createdAt: -1 });

const BuyerRating = mongoose.model<IBuyerRatingDocument>('BuyerRating', buyerRatingSchema);

export default BuyerRating;
