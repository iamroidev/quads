import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from '../models/User';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/quads';

function isInstitutionalEmail(email?: string): boolean {
  if (!email) return false;
  return /@(student\.)?umat\.edu\.gh$/i.test(email) || /@st\.umat\.edu\.gh$/i.test(email);
}

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const users = await User.find({ isVerified: true });
    console.log(`Found ${users.length} verified users:`);
    for (const u of users) {
      const email = u.email;
      const isInst = isInstitutionalEmail(email);
      console.log(`- Name: ${u.name}, Email: ${email}, Roles: ${JSON.stringify(u.roles)}, isInstitutional: ${isInst}, idVerificationStatus: ${u.idVerificationStatus}`);
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

run();
