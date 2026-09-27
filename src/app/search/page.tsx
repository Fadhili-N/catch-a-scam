import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Account } from '@/lib/types'

async function searchAccounts(query: string): Promise<Account[]> {
  const trimmed = query.trim()
  if (!trimmed) return []

  const supabase = await createClient()
  // Plain substring matching for v1. The pg_trgm index created in
  // 0001_init.sql is there for a fuzzier match (so "shoeplugke" still finds
  // "shoe.plug.ke") — worth upgrading to once this misses real searches.
  const { data, error } = await supabase.from('accounts').select('*').ilike('handle', `%${trimmed}%`).limit(20)

  if (error) {
    console.error('Search failed:', error.message)
    return []
  }
  return data
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = q ?? ''
  const results = query ? await searchAccounts(query) : []

  return (
    <div className="min-h-screen bg-zinc-50">
      <main className="mx-auto max-w-2xl px-4 py-16">
        <Link href="/" className="text-sm text-zinc-500 hover:underline">
          ← Back
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-zinc-900">
          {query ? `Results for "${query}"` : 'Search'}
        </h1>

        {query && results.length === 0 && (
          <p className="mt-6 text-zinc-600">
            No reports found for &ldquo;{query}&rdquo;. That does not confirm this seller is safe —
            it only means nobody has reported them here yet.
          </p>
        )}

        <ul className="mt-6 space-y-3">
          {results.map((account) => (
            <li key={account.id} className="rounded-lg border border-zinc-200 bg-white p-4">
              <Link
                href={`/accounts/${account.platform}/${account.handle}`}
                className="font-medium text-zinc-900 hover:underline"
              >
                @{account.handle}
                <span className="ml-2 text-xs font-normal uppercase text-zinc-400">{account.platform}</span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
