import { createClient } from '@supabase/supabase-js'

/**
 * Browser-safe Supabase client.
 *
 * Uses the public URL and anon/publishable key only — both are safe to ship
 * to the browser. What this client is allowed to read or write is enforced
 * entirely by Row Level Security policies on the database, not by anything
 * in this file. Never import the service-role key here.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Copy .env.example to .env.local and fill in your Supabase project values.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
