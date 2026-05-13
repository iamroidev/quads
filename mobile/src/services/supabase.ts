import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const extras = (Constants.expoConfig?.extra || {}) as {
  supabaseUrl?: string;
  supabaseKey?: string;
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || extras.supabaseUrl || '';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY || extras.supabaseKey || '';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase mobile env vars: EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: false,
  },
});
