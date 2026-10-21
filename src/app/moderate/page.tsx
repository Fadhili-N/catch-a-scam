import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { getProfile, isModerator } from '@/lib/auth'
import { ReportCard, type ReportForModeration } from '@/components/moderation/report-card'
import type { ReportStatus } from '@/lib/types'

const TABS: ReportStatus[] = ['pending', 'approved', 'rejected']

async function getReports(supabase: SupabaseClient, status: ReportStatus): Promise<ReportForModeration[]> {
  const { data, error } = await supabase
    .from('reports')
    .select('*, accounts(*), identifiers(*), evidence(*)')
    .eq('status', status)
    .order('created_at', { ascending: status === 'pending' }) // oldest-first queue for pending; newest-first history otherwise

  if (error) {
    console.error('Failed to load reports for moderation:', error.message)
    return []
  }
  return data as ReportForModeration[]
}

/**
 * Evidence is never publicly reachable (0001_init.sql) — a moderator views
 * it only through a signed URL, generated here and good for 5 minutes,
 * which is plenty for one page view. createSignedUrl itself is subject to
 * the same storage RLS policy that gates everything else about evidence:
 * it will simply fail for anyone the "readable by uploader and moderators"
 * policy in 0004_submit_report.sql doesn't cover.
 */
async function getEvidenceUrls(
  supabase: SupabaseClient,
  reports: ReportForModeration[]
): Promise<Record<string, string>> {
  const urls: Record<string, string> = {}
  const allEvidence = reports.flatMap((r) => r.evidence)

  await Promise.all(
    allEvidence.map(async (item) => {
      const { data, error } = await supabase.storage.from('evidence').createSignedUrl(item.storage_path, 300)
      if (error) {
        console.error(`Failed to sign URL for evidence ${item.id}:`, error.message)
        return
      }
      urls[item.id] = data.signedUrl
    })
  )

  return urls
}

export default async function ModeratePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/moderate')

  const profile = await getProfile(supabase, user.id)
  if (!isModerator(profile)) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <main className="mx-auto max-w-2xl px-4 py-16">
          <h1 className="text-2xl font-bold text-zinc-900">Not authorized</h1>
          <p className="mt-2 text-zinc-600">This page is for moderators only.</p>
          <Link href="/" className="mt-4 inline-block text-sm text-zinc-500 underline">
            ← Back to home
          </Link>
        </main>
      </div>
    )
  }

  const { status: rawStatus } = await searchParams
  const status: ReportStatus = TABS.includes(rawStatus as ReportStatus) ? (rawStatus as ReportStatus) : 'pending'

  const reports = await getReports(supabase, status)
  const evidenceUrls = await getEvidenceUrls(supabase, reports)

  return (
    <div className="min-h-screen bg-zinc-50">
      <main className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="text-2xl font-bold text-zinc-900">Moderation queue</h1>

        <nav className="mt-4 flex gap-4 border-b border-zinc-200 text-sm">
          {TABS.map((tab) => (
            <Link
              key={tab}
              href={`/moderate?status=${tab}`}
              className={`pb-2 ${status === tab ? 'border-b-2 border-zinc-900 font-medium text-zinc-900' : 'text-zinc-500'}`}
            >
              {tab[0].toUpperCase() + tab.slice(1)}
            </Link>
          ))}
        </nav>

        <section className="mt-6 space-y-4">
          {reports.length === 0 ? (
            <p className="text-zinc-500">Nothing here.</p>
          ) : (
            reports.map((report) => <ReportCard key={report.id} report={report} evidenceUrls={evidenceUrls} />)
          )}
        </section>
      </main>
    </div>
  )
}
