import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';
import User from '../src/models/User';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const ensureAiUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to MongoDB');

    const email = 'support@quadsmarket.tech';
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log('AI Support user already exists.');
    } else {
      await User.create({
        name: 'QUADS AI Support',
        email,
        password: 'ai-support-hardened-password-123!', // This won't be used for login
        role: 'admin',
        isVerified: true,
        emailVerified: true,
        avatar: 'https://res.cloudinary.com/quads/image/upload/v1/assets/ai-avatar.png',
        bio: 'Official QUADS Marketplace AI Assistant. I am here to help you with your queries.',
      });
      console.log('AI Support user created successfully.');
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error ensuring AI user:', error);
    process.exit(1);
  }
};

ensureAiUser();
