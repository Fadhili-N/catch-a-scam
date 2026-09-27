import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Where Supabase sends the browser after a confirmation-email link (or,
 * later, after a Google sign-in) is clicked. The URL carries a one-time
 * `code`, which is exchanged here for the actual signed-in session.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=confirmation_failed`)
}
