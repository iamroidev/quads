import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import axios from 'axios';
import User from '../models/User';
import connectDB from '../config/db';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const seedDemoAdmin = async () => {
  const email = 'admin@quads.app';
  const password = 'password123';
  const name = 'Demo Admin';

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
  }

  try {
    await connectDB();
    console.log(`Connecting to Supabase to prepare demo admin: ${email}...`);

    // 1. Create in Supabase via Admin API
    let supabaseId = '';
    try {
      const res = await axios.post(
        `${SUPABASE_URL}/auth/v1/admin/users`,
        {
          email,
          password,
          email_confirm: true,
          user_metadata: { name }
        },
        {
          headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      supabaseId = res.data.id;
      console.log('Supabase user created/verified.');
    } catch (err: any) {
      if (err.response?.data?.message?.includes('already exists')) {
        console.log('Supabase user already exists, fetching ID...');
        // List users to find the ID
        const listRes = await axios.get(`${SUPABASE_URL}/auth/v1/admin/users`, {
          headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
          }
        });
        const existing = listRes.data.users.find((u: any) => u.email === email);
        if (existing) supabaseId = existing.id;
      } else {
        throw err;
      }
    }

    if (!supabaseId) throw new Error('Could not resolve Supabase ID');

    // 2. Create/Update in MongoDB
    const user = await User.findOneAndUpdate(
      { email },
      {
        supabaseId,
        name,
        email,
        password: 'demo_password_not_used', // Auth handled by Supabase
        role: 'admin',
        isVerified: true,
        emailVerified: true,
        avatar: `https://ui-avatars.com/api/?name=Admin&background=000&color=fff`,
      },
      { upsert: true, new: true }
    );

    console.log('------------------------------------------');
    console.log('DEMO ADMIN READY');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Supabase ID: ${supabaseId}`);
    console.log('------------------------------------------');
    
    process.exit(0);
  } catch (err: any) {
    console.error('Seeding failed:', err.response?.data || err.message);
    process.exit(1);
  }
};

seedDemoAdmin();
