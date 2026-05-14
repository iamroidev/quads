import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseKey);

// Defensive check to prevent app-wide crash if env vars are missing at build time
if (!isSupabaseConfigured) {
  console.error('❌ CRITICAL: Supabase environment variables are missing! Check Vercel settings for VITE_SUPABASE_URL and VITE_SUPABASE_KEY.');
}

// Initialize with placeholders to prevent crash, but log error above
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);
