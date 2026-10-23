import { cache } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { formatMoney, formatDate, IDENTIFIER_LABELS, PLATFORM_LABELS } from '@/lib/format'
import type { Account, Identifier, Report } from '@/lib/types'

export const revalidate = 30

type ReportWithIdentifiers = Report & { identifiers: Identifier[] }

// Wrapped in React's cache() so generateMetadata (below) and the page
// component itself — which Next.js calls separately for the same
// request — share one database call instead of two. This only works
// because the function creates its own Supabase client internally rather
// than taking one as a parameter: cache() keys on its arguments by
// identity, and two separate createClient() calls are two different
// object references even though they behave identically.
const getAccount = cache(async (platform: string, handle: string): Promise<Account | null> => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('platform', platform)
    .eq('handle', handle)
    .eq('is_public', true)
    .maybeSingle()

  if (error) {
    console.error('Failed to load account:', error.message)
    return null
  }
  return data
})

export async function generateMetadata({
  params,
}: {
  params: Promise<{ platform: string; handle: string }>
}): Promise<Metadata> {
  const { platform, handle } = await params
  const account = await getAccount(platform, handle)

  if (!account) {
    return { title: 'Account not found' }
  }

  // The root layout's title template (%s — Catch a Scam) only applies to
  // the <title> tag itself, not to Open Graph/Twitter fields — those need
  // the site name added explicitly, or a shared link preview on WhatsApp
  // would show just the bare handle with no indication of what site it's from.
  const title = `@${account.handle} (${PLATFORM_LABELS[account.platform] ?? account.platform})`
  const socialTitle = `${title} — Catch a Scam`
  const description = `Reports filed against @${account.handle} on ${PLATFORM_LABELS[account.platform] ?? account.platform} — check before you pay.`
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const url = `${siteUrl}/accounts/${account.platform}/${account.handle}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title: socialTitle, description, url, type: 'profile' },
    twitter: { card: 'summary', title: socialTitle, description },
  }
}

async function getApprovedReports(
  supabase: SupabaseClient,
  accountId: string
): Promise<ReportWithIdentifiers[]> {
  const { data, error } = await supabase
    .from('reports')
    .select('*, identifiers(*)')
    .eq('account_id', accountId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to load reports:', error.message)
    return []
  }
  return data as ReportWithIdentifiers[]
}

/**
 * Finds other public accounts whose reports cite the same payment or
 * contact identifier as this one. This is the mechanism that catches a
 * scam page after it has rebranded under a new handle: the product photos
 * and account name change, but the till number collecting the money
 * usually doesn't.
 */
async function getLinkedAccounts(
  supabase: SupabaseClient,
  normalizedValues: string[],
  excludeAccountId: string
): Promise<Account[]> {
  if (normalizedValues.length === 0) return []

  const { data, error } = await supabase
    .from('identifiers')
    .select('reports(account_id, accounts(*))')
    .in('normalized_value', normalizedValues)

  if (error) {
    console.error('Failed to load linked accounts:', error.message)
    return []
  }

  type Row = { reports: { account_id: string; accounts: Account } | null }
  const seen = new Map<string, Account>()
  for (const row of data as unknown as Row[]) {
    const account = row.reports?.accounts
    if (account && account.id !== excludeAccountId) {
      seen.set(account.id, account)
    }
  }
  return [...seen.values()]
}

/**
 * The photo-based counterpart to getLinkedAccounts above: same idea (a
 * rebranded scam page usually keeps something it didn't bother changing),
 * different signal (a reused product photo instead of a reused till/
 * phone number). Unlike identifiers, evidence itself is never publicly
 * selectable, so this can't be a plain query the way getLinkedAccounts
 * is — it goes through get_photo_linked_accounts, a security-definer
 * function added in 0005_photo_matches.sql that does the necessary join
 * without ever exposing a raw evidence row to this (possibly anonymous)
 * request. Populated only once the Python image-matching service
 * (services/image-matching) has analyzed a report — see
 * src/app/moderate/actions.ts, which triggers that on approval.
 */
async function getPhotoLinkedAccounts(supabase: SupabaseClient, accountId: string): Promise<Account[]> {
  const { data, error } = await supabase.rpc('get_photo_linked_accounts', { account_id_in: accountId })
  if (error) {
    console.error('Failed to load photo-linked accounts:', error.message)
    return []
  }
  return data as Account[]
}

function incrementViewCount(supabase: SupabaseClient, accountId: string) {
  // Fire-and-forget: a failed view count must never block the page from
  // rendering, so its error is logged rather than thrown.
  supabase.rpc('increment_account_view_count', { account_id_in: accountId }).then(({ error }: { error: { message: string } | null }) => {
    if (error) console.error('Failed to increment view count:', error.message)
  })
}

export default async function AccountPage({
  params,
}: {
  params: Promise<{ platform: string; handle: string }>
}) {
  const { platform, handle } = await params
  const supabase = await createClient()
  const account = await getAccount(platform, handle)
  if (!account) notFound()

  incrementViewCount(supabase, account.id)

  const reports = await getApprovedReports(supabase, account.id)
  const totalLost = reports.reduce((sum, r) => sum + (r.amount_lost ?? 0), 0)
  const allIdentifierValues = [...new Set(reports.flatMap((r) => r.identifiers.map((i) => i.normalized_value)))]
  const [identifierLinkedAccounts, photoLinkedAccounts] = await Promise.all([
    getLinkedAccounts(supabase, allIdentifierValues, account.id),
    getPhotoLinkedAccounts(supabase, account.id),
  ])
  // Merged rather than shown as two separate sections — the distinction
  // between "same till number" and "same product photo" matters for our
  // own reasoning, but to a visitor deciding whether to pay, "this is
  // connected to N other reported accounts" is the one fact that matters.
  const linkedAccounts = [...new Map([...identifierLinkedAccounts, ...photoLinkedAccounts].map((a) => [a.id, a])).values()]

  return (
    <div className="min-h-screen bg-zinc-50">
      <main className="mx-auto max-w-2xl px-4 py-16">
        <Link href="/" className="text-sm text-zinc-500 hover:underline">
          ← Back
        </Link>

        <h1 className="mt-4 text-2xl font-bold text-zinc-900">@{account.handle}</h1>
        <p className="text-sm uppercase text-zinc-400">{account.platform}</p>

        <div className="mt-4 flex gap-6 text-sm text-zinc-600">
          <span>
            <strong className="text-zinc-900">{reports.length}</strong> report{reports.length === 1 ? '' : 's'}
          </span>
          <span>
            <strong className="text-zinc-900">{formatMoney(totalLost, 'KES')}</strong> reported lost
          </span>
        </div>

        {linkedAccounts.length > 0 && (
          <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-4">
            <p className="font-medium text-amber-900">
              A payment/contact detail or a product photo used here also appears on {linkedAccounts.length} other
              reported account{linkedAccounts.length === 1 ? '' : 's'}:
            </p>
            <ul className="mt-2 space-y-1">
              {linkedAccounts.map((linked) => (
                <li key={linked.id}>
                  <Link href={`/accounts/${linked.platform}/${linked.handle}`} className="text-amber-900 underline">
                    @{linked.handle} ({linked.platform})
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <section className="mt-8 space-y-4">
          {reports.map((report) => (
            <article key={report.id} className="rounded-lg border border-zinc-200 bg-white p-4">
              <p className="font-medium text-zinc-900">{report.promised_item ?? 'Item not stated'}</p>
              <p className="mt-1 text-sm text-zinc-600">{report.narrative}</p>
              <p className="mt-2 text-sm text-zinc-500">
                {formatMoney(report.amount_lost, report.currency)} · {formatDate(report.incident_date)}
              </p>
              {report.identifiers.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {report.identifiers.map((id) => (
                    <li key={id.id} className="rounded bg-zinc-100 px-2 py-1 text-xs text-zinc-600">
                      {IDENTIFIER_LABELS[id.type] ?? id.type}: {id.raw_value}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </section>

        <p className="mt-10 text-xs text-zinc-400">
          Reports here are user submissions, not confirmed findings of fact.
        </p>
      </main>
    </div>
  )
}
