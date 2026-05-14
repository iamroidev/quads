import mongoose, { Document, Schema } from 'mongoose';

export interface IPayoutDocument extends Document {
  order: mongoose.Types.ObjectId;
  transaction: mongoose.Types.ObjectId;
  seller: mongoose.Types.ObjectId;
  amount: number;
  commissionAmount: number;
  platformCommission: number; // percentage deducted
  netAmount: number; // amount seller receives after commission
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  paystackTransferCode?: string;
  paystackTransferId?: number;
  paystackRecipientCode?: string;
  failureReason?: string;
  processedBy?: mongoose.Types.ObjectId; // admin who processed it
  processedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const payoutSchema = new Schema<IPayoutDocument>(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    transaction: {
      type: Schema.Types.ObjectId,
      ref: 'Transaction',
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
    commissionAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    platformCommission: {
      type: Number,
      default: 10, // percentage
      min: 0,
      max: 100,
    },
    netAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'GHS',
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    paystackTransferCode: {
      type: String,
    },
    paystackTransferId: {
      type: Number,
    },
    paystackRecipientCode: {
      type: String,
    },
    failureReason: {
      type: String,
    },
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    processedAt: Date,
    completedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
payoutSchema.index({ seller: 1, status: 1 });
payoutSchema.index({ order: 1 });
payoutSchema.index({ status: 1 });

export default mongoose.model<IPayoutDocument>('Payout', payoutSchema);