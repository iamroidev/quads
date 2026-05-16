import mongoose, { Document, Schema } from 'mongoose';

export interface IStoreDocument extends Document {
  _id: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  avatar: string;
  banner: string;
  bio: string;
  description: string;
  location: string;
  phone: string;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  totalSales: number;
  activeListingsCount: number;
  vacationMode: {
    active: boolean;
    message?: string;
    returnDate?: Date;
  };
  socials: {
    whatsapp?: string;
    twitter?: string;
    instagram?: string;
  };
  payoutSetupComplete: boolean;
  payoutMethod?: 'momo' | 'bank';
  payoutProvider?: string;
  payoutAccountName?: string;
  payoutAccountNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

const storeSchema = new Schema<IStoreDocument>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Store must have an owner'],
      unique: true,
    },
    name: {
      type: String,
      required: [true, 'Store name is required'],
      trim: true,
      maxlength: [80, 'Store name cannot exceed 80 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Store slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    banner: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
      maxlength: [160, 'Bio cannot exceed 160 characters'],
    },
    description: {
      type: String,
      default: '',
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    location: {
      type: String,
      default: '',
      trim: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    rating: {
      type: Number,
      default: 0,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    totalSales: {
      type: Number,
      default: 0,
    },
    activeListingsCount: {
      type: Number,
      default: 0,
    },
    vacationMode: {
      active: { type: Boolean, default: false },
      message: { type: String, default: '' },
      returnDate: { type: Date },
    },
    socials: {
      whatsapp: String,
      twitter: String,
      instagram: String,
    },
    payoutSetupComplete: {
      type: Boolean,
      default: false,
    },
    payoutMethod: {
      type: String,
      enum: ['momo', 'bank'],
    },
    payoutProvider: { type: String, default: '' },
    payoutAccountName: { type: String, default: '' },
    payoutAccountNumber: { type: String, default: '' },
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

// Index for search and lookup
storeSchema.index({ name: 'text', description: 'text', slug: 1 });

const Store = mongoose.model<IStoreDocument>('Store', storeSchema);

export default Store;
