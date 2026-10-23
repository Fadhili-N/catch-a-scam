import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import type { Account } from '@/lib/types'

// Without this, the sitemap would be generated once at build time and
// never again — fine for the static legal pages, wrong for the account
// list, which gains new entries every time a moderator approves a report.
export const revalidate = 3600

// A plain anon-key client, not the cookie-aware wrapper in
// lib/supabase/server.ts — this route lists public accounts only, which
// needs no session at all, and sitemap.ts has no authenticated-user
// request context to read cookies from in the first place.
async function getPublicAccounts(): Promise<Account[]> {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data, error } = await supabase.from('accounts').select('*').eq('is_public', true)
  if (error) {
    console.error('Failed to load accounts for sitemap:', error.message)
    return []
  }
  return data
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const accounts = await getPublicAccounts()

  return [
    { url: siteUrl, changeFrequency: 'daily', priority: 1 },
    { url: `${siteUrl}/search`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${siteUrl}/terms`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${siteUrl}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${siteUrl}/takedown`, changeFrequency: 'yearly', priority: 0.2 },
    ...accounts.map((account) => ({
      url: `${siteUrl}/accounts/${account.platform}/${account.handle}`,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ]
}
