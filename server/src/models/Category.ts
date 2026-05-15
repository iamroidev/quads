import mongoose, { Document, Schema } from 'mongoose';

export interface ICategoryDocument extends Document {
  name: string;
  slug: string;
  icon: string;
  description: string;
  parent?: mongoose.Types.ObjectId | ICategoryDocument;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategoryDocument>(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    icon: {
      type: String,
      default: 'package',
    },
    description: {
      type: String,
      default: '',
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
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

const Category = mongoose.model<ICategoryDocument>('Category', categorySchema);

export default Category;
