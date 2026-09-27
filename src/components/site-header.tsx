import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

/**
 * A Server Component, not a Client Component: it reads the session
 * directly from the request's cookies via the server Supabase client, so
 * the correct logged-in/logged-out state is part of the very first HTML
 * sent down — no flash of the wrong state while JavaScript loads.
 */
export async function SiteHeader() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  const user = data.user

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold text-zinc-900">
          Catch a Scam
        </Link>

        {user ? (
          <div className="flex items-center gap-3 text-sm text-zinc-600">
            <span>{user.email}</span>
            <form action="/auth/logout" method="post">
              <button type="submit" className="text-zinc-900 underline">
                Log out
              </button>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-4 text-sm">
            <Link href="/login" className="text-zinc-600 hover:underline">
              Log in
            </Link>
            <Link href="/signup" className="font-medium text-zinc-900 hover:underline">
              Sign up
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}
