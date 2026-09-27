import Link from 'next/link'
// Reused from the browser client for now: an anonymous read needs no
// cookies or session, so this works fine server-side too. A cookie-aware
// server client arrives in Phase 3 once login exists.
import { supabase } from '@/lib/supabase/client'
import { formatMoney, formatDate } from '@/lib/format'
import type { Account, Report } from '@/lib/types'

// Re-render at most every 30s so newly-approved reports show up without a
// full redeploy, instead of caching the page forever as fully static.
export const revalidate = 30

type ReportWithAccount = Report & { accounts: Account }

async function getRecentReports(): Promise<ReportWithAccount[]> {
  const { data, error } = await supabase
    .from('reports')
    .select('*, accounts(*)')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Failed to load recent reports:', error.message)
    return []
  }
  return data as ReportWithAccount[]
}

export default async function Home() {
  const reports = await getRecentReports()

  return (
    <div className="min-h-screen bg-zinc-50">
      <main className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="text-3xl font-bold text-zinc-900">Catch a Scam</h1>
        <p className="mt-2 text-zinc-600">
          Check a TikTok or Instagram seller before you pay. Free to search — no account needed.
        </p>

        <form action="/search" method="get" className="mt-8 flex gap-2">
          <input
            type="text"
            name="q"
            placeholder="Search a handle, e.g. shoeplug.ke"
            className="flex-1 rounded-lg border border-zinc-300 px-4 py-3 text-base"
            required
          />
          <button type="submit" className="rounded-lg bg-zinc-900 px-5 py-3 font-medium text-white">
            Search
          </button>
        </form>

        <section className="mt-12">
          <h2 className="text-lg font-semibold text-zinc-900">Recently reported</h2>
          {reports.length === 0 ? (
            <p className="mt-3 text-zinc-500">No reports yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {reports.map((report) => (
                <li key={report.id} className="rounded-lg border border-zinc-200 bg-white p-4">
                  <Link
                    href={`/accounts/${report.accounts.platform}/${report.accounts.handle}`}
                    className="font-medium text-zinc-900 hover:underline"
                  >
                    @{report.accounts.handle}
                    <span className="ml-2 text-xs font-normal uppercase text-zinc-400">
                      {report.accounts.platform}
                    </span>
                  </Link>
                  <p className="mt-1 text-sm text-zinc-600">{report.promised_item}</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {formatMoney(report.amount_lost, report.currency)} · {formatDate(report.incident_date)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="mt-10 text-xs text-zinc-400">
          Reports here are user submissions, not confirmed findings of fact.
        </p>
      </main>
    </div>
  )
}
