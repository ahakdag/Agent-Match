import { createClient } from '@supabase/supabase-js';

// Helper to get environment variables safely in both browser and server
const getEnv = (key: string): string => {
  // Static replacements for Vite's define
  if (key === 'SUPABASE_URL') return process.env.SUPABASE_URL || '';
  if (key === 'SUPABASE_ANON_KEY') return process.env.SUPABASE_ANON_KEY || '';
  if (key === 'SUPABASE_SERVICE_ROLE_KEY') return process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (key === 'GEMINI_API_KEY') return process.env.GEMINI_API_KEY || '';

  // Fallback for other keys or server-side dynamic access
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  
  // Check import.meta.env (Vite client-side)
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore
    return (import.meta.env[`VITE_${key}`] as string) || (import.meta.env[key] as string) || '';
  }
  return '';
};

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');
const supabaseServiceKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials missing. App may not function correctly.");
}

// Client for public/client-side use
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);

// Admin client for server-side operations (bypasses RLS)
// This will only have the real service key on the server
export const supabaseAdmin = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseServiceKey || supabaseAnonKey || 'placeholder'
);
