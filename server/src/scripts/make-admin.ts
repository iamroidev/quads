import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from '../models/User';
import connectDB from '../config/db';

// Load env from the root of server
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const promoteUser = async (email: string) => {
  try {
    console.log(`Connecting to database to promote ${email}...`);
    await connectDB();
    
    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      { $addToSet: { roles: 'admin' } },
      { new: true }
    );

    if (user) {
      console.log('------------------------------------------');
      console.log('SUCCESS: ADMINISTRATIVE PRIVILEGES GRANTED');
      console.log(`User: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`New Roles: ${user.roles.join(', ')}`);
      console.log('------------------------------------------');
    } else {
      console.log('------------------------------------------');
      console.log(`ERROR: User with email "${email}" not found.`);
      console.log('Please ensure you have registered this email first.');
      console.log('------------------------------------------');
    }
    process.exit(0);
  } catch (err) {
    console.error('Promotion failed:', err);
    process.exit(1);
  }
};

const email = process.argv[2];
if (!email) {
  console.log('Usage: npx ts-node src/scripts/make-admin.ts <email>');
  process.exit(1);
}

promoteUser(email);
