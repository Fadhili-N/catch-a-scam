import { createBrowserClient } from '@supabase/ssr'

/**
 * Supabase client for Client Components — anything with a 'use client'
 * directive, e.g. the login/signup forms. Session storage is handled via
 * cookies so the server can read the same session (see server.ts).
 *
 * Never import the service-role key here. What this client is allowed to
 * do is enforced entirely by Row Level Security on the database.
 */

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
        'Copy .env.example to .env.local and fill in your Supabase project values.'
    )
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
