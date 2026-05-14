import { createClient } from '@supabase/supabase-js';

const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL     ?? '';
const supabaseAnon    = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const supabaseService = process.env.SUPABASE_SERVICE_KEY          ?? '';

// Public client — respects RLS, for use in browser/client components
export const supabase = createClient(
  supabaseUrl  || 'https://placeholder.supabase.co',
  supabaseAnon || 'placeholder'
);

// Service client — bypasses RLS, for use in API routes only
export const supabaseAdmin = () =>
  createClient(
    supabaseUrl    || 'https://placeholder.supabase.co',
    supabaseService || 'placeholder',
    { auth: { persistSession: false } }
  );
