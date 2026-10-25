import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/types'

/** Shared by the moderation page (to gate access) and the header (to show
 * the "Moderate" link only to those who can use it) — one query, one place
 * that knows the shape of the answer. */
export async function getProfile(supabase: SupabaseClient, userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) {
    console.error('Failed to load profile:', error.message)
    return null
  }
  return data
}

export function isModerator(profile: Profile | null): boolean {
  return profile?.role === 'moderator' || profile?.role === 'admin'
}

/** Used at the top of every moderator-only Server Action — moderate/actions.ts
 * and moderate/advertisers/actions.ts both call this first. RLS would reject
 * the write either way, but checking explicitly here gives a clear "Not
 * authorized" error instead of an opaque RLS failure, and reads as the
 * actual access rule the action enforces, not an implementation detail of
 * the database underneath it. */
export async function requireModerator() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in.')

  const profile = await getProfile(supabase, user.id)
  if (!isModerator(profile)) throw new Error('Not authorized.')

  return { supabase, user }
}
