import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ReportForm } from '@/components/report-form'

export default async function ReportPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Posting requires an account; reading never does (README principle 1).
  // Enforced here at the page level, and separately at the database level
  // by the RLS insert policies — this redirect is just the friendly version.
  if (!user) {
    redirect('/login?next=/report')
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <main className="mx-auto max-w-2xl px-4 py-16">
        <Link href="/" className="text-sm text-zinc-500 hover:underline">
          ← Back
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-zinc-900">Report a scam account</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Report the trading handle that scammed you, not a person&rsquo;s real name. This takes about
          five minutes.
        </p>

        <div className="mt-8">
          <ReportForm />
        </div>
      </main>
    </div>
  )
}
