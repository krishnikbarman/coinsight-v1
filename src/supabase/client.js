import { createClient } from '@supabase/supabase-js';

// Get Supabase configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Track connection status (for error handling)
export let supabaseConfigValid = true;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '❌ Missing Supabase configuration. Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.'
  );
  supabaseConfigValid = false;
}

// Validate URL format
if (supabaseUrl && (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co'))) {
  console.error(
    '❌ Invalid Supabase URL format. Expected format: https://your-project.supabase.co'
  );
  supabaseConfigValid = false;
}

// Initialize Supabase client (even with invalid config to prevent app crashes)
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
    },
  }
);
