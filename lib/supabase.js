// Import Supabase client
import { createClient as createSupabaseClient } from '@supabase/supabase-js'


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if Supabase is properly configured
const isConfigured = supabaseUrl && 
                     supabaseAnonKey && 
                     supabaseUrl !== 'https://placeholder.supabase.co' && 
                     supabaseAnonKey !== 'placeholder-key' &&
                     supabaseUrl.startsWith('https://') &&
                     supabaseAnonKey.length > 20

// Create Supabase client
export const supabase = createSupabaseClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: isConfigured,
      autoRefreshToken: isConfigured,
    },
  }
)

// Log warning if not configured (only in development)
if (typeof window !== 'undefined' && !isConfigured) {
  console.warn('⚠️ Supabase credentials not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local')
}

