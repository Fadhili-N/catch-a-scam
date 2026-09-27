import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Supabase client for Server Components, Route Handlers, and Server
 * Actions. Reads the logged-in user's session from the request's cookies,
 * so server-rendered pages see the same session the browser does.
 *
 * A fresh client is created per request rather than shared as a singleton
 * — this is Supabase's documented pattern for Next.js's App Router, since
 * each request carries its own cookies.
 *
 * Never import the service-role key here either — this client still runs
 * under the signed-in user's own permissions, enforced by Row Level
 * Security. The service-role key is reserved for standalone scripts
 * (scripts/seed.mjs) and, later, the moderation admin tools.
 */
export async function createClient() {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
        'Copy .env.example to .env.local and fill in your Supabase project values.'
    )
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // setAll is called from a Server Component in some cases (e.g.
          // rendering a page directly, with no middleware in front of it).
          // Server Components cannot set cookies — that's fine as long as
          // the middleware below is also refreshing the session, which it
          // is on every request that matters.
        }
      },
    },
  })
}
