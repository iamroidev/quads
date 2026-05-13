import mongoose, { Document, Schema } from 'mongoose';

export interface IVerificationCode extends Document {
  userId: mongoose.Types.ObjectId;
  email?: string;
  phone?: string;
  code: string;
  type: 'email' | 'phone';
  purpose: 'verify_email' | 'verify_phone' | 'reset_password';
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  verifiedAt?: Date;
  createdAt: Date;
}

const verificationCodeSchema = new Schema<IVerificationCode>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    code: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['email', 'phone'],
      required: true,
    },
    purpose: {
      type: String,
      enum: ['verify_email', 'verify_phone', 'reset_password'],
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 5,
    },
    verifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index — auto-delete expired codes after 1 hour past expiry
verificationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 3600 });
// For fast lookups
verificationCodeSchema.index({ userId: 1, type: 1, purpose: 1 });
verificationCodeSchema.index({ email: 1, purpose: 1 });

const VerificationCode = mongoose.model<IVerificationCode>('VerificationCode', verificationCodeSchema);

export default VerificationCode;