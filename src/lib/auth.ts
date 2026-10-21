import type { SupabaseClient } from '@supabase/supabase-js'
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
