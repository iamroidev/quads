import mongoose, { Schema, Document } from 'mongoose';

export interface ISupportRequest extends Document {
  source: 'tawk' | 'internal' | 'email';
  externalId?: string; // e.g. Tawk chatId
  visitorEmail: string;
  visitorName?: string;
  subject: string;
  lastMessage: string;
  aiSuggestedReply?: string;
  status: 'open' | 'pending' | 'resolved';
  createdAt: Date;
  updatedAt: Date;
}

const SupportRequestSchema: Schema = new Schema(
  {
    source: { type: String, enum: ['tawk', 'internal', 'email'], default: 'internal' },
    externalId: { type: String },
    visitorEmail: { type: String, required: true },
    visitorName: { type: String },
    subject: { type: String, required: true },
    lastMessage: { type: String, required: true },
    aiSuggestedReply: { type: String },
    status: { type: String, enum: ['open', 'pending', 'resolved'], default: 'open' },
  },
  { timestamps: true }
);

export default mongoose.model<ISupportRequest>('SupportRequest', SupportRequestSchema);
