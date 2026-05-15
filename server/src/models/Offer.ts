import mongoose, { Document, Schema } from 'mongoose';

export interface IOfferDocument extends Document {
  product: mongoose.Types.ObjectId;
  buyer: mongoose.Types.ObjectId;
  seller: mongoose.Types.ObjectId;
  amount: number;
  status: 'pending' | 'accepted' | 'declined' | 'countered' | 'expired';
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const offerSchema = new Schema<IOfferDocument>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
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
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'countered', 'expired'],
      default: 'pending',
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
offerSchema.index({ product: 1, buyer: 1, status: 1 });
offerSchema.index({ seller: 1, status: 1 });

export default mongoose.model<IOfferDocument>('Offer', offerSchema);
