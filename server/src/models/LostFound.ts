import mongoose, { Document, Schema } from 'mongoose';

export interface ILostFoundDocument extends Document {
  type: 'lost' | 'found';
  title: string;
  category: 'keys' | 'id_card' | 'laptop' | 'phone' | 'bag' | 'books' | 'other';
  date: Date;
  location: string;
  description: string;
  contactName: string;
  contactInfo: string;
  imageUrl?: string;
  userId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const lostFoundSchema = new Schema<ILostFoundDocument>({
  type: { type: String, enum: ['lost', 'found'], required: true },
  title: { type: String, required: true, trim: true, maxlength: 100 },
  category: { type: String, enum: ['keys', 'id_card', 'laptop', 'phone', 'bag', 'books', 'other'], required: true },
  date: { type: Date, required: true },
  location: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true, maxlength: 1000 },
  contactName: { type: String, required: true, trim: true },
  contactInfo: { type: String, required: true, trim: true },
  imageUrl: { type: String, trim: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

lostFoundSchema.index({ type: 1 });
lostFoundSchema.index({ category: 1 });
lostFoundSchema.index({ createdAt: -1 });

export default mongoose.model<ILostFoundDocument>('LostFound', lostFoundSchema);
