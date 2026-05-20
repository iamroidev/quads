import mongoose, { Document, Schema } from 'mongoose';

export interface IReportDocument extends Document {
  reporter: mongoose.Types.ObjectId;
  reportedUser: mongoose.Types.ObjectId;
  reason: 'harassment' | 'spam' | 'scam' | 'inappropriate' | 'fake_listing' | 'other';
  description: string;
  status: 'pending' | 'reviewed' | 'actioned' | 'dismissed';
  adminNote?: string;
  conversationId?: mongoose.Types.ObjectId;
  productId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<IReportDocument>({
  reporter:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reportedUser: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reason:       { type: String, enum: ['harassment', 'spam', 'scam', 'inappropriate', 'fake_listing', 'other'], required: true },
  description:  { type: String, required: true, maxlength: 1000 },
  status:       { type: String, enum: ['pending', 'reviewed', 'actioned', 'dismissed'], default: 'pending' },
  adminNote:    { type: String },
  conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation' },
  productId:      { type: Schema.Types.ObjectId, ref: 'Product' },
}, { timestamps: true });

reportSchema.index({ reporter: 1, reportedUser: 1 });
reportSchema.index({ status: 1 });

export default mongoose.model<IReportDocument>('Report', reportSchema);
