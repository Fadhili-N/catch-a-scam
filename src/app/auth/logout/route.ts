import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Deliberately POST-only. A logout triggered by a plain GET link can fire
 * accidentally — a browser link-prefetch, or even a stray <img src>
 * pointed at the URL — so this only responds to an actual form submission.
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/', request.url))
}
