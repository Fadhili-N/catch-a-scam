import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getProfile, isModerator } from '@/lib/auth'
import { CATEGORY_LABELS } from '@/lib/format'
import type { Advertiser } from '@/lib/types'
import { createAdvertiser, toggleAdvertiserActive } from './actions'

export default async function AdvertisersAdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/moderate/advertisers')

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

  // Moderators see every advertiser regardless of status (0007_advertisers.sql)
  // — the public policy only shows active, currently-running ones.
  const { data, error } = await supabase.from('advertisers').select('*').order('created_at', { ascending: false })
  if (error) console.error('Failed to load advertisers:', error.message)
  const advertisers = (data ?? []) as Advertiser[]

  return (
    <div className="min-h-screen bg-zinc-50">
      <main className="mx-auto max-w-2xl px-4 py-16">
        <Link href="/moderate" className="text-sm text-zinc-500 hover:underline">
          ← Back to moderation queue
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-zinc-900">Advertisers</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Shown as &ldquo;legit sellers like this&rdquo; on an account page when its category matches. Add
          one here after they&rsquo;ve paid you directly — there&rsquo;s no self-serve signup yet.
        </p>

        <form action={createAdvertiser} className="mt-6 space-y-3 rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="font-semibold text-zinc-900">Add an advertiser</h2>

          <div>
            <label htmlFor="businessName" className="block text-sm font-medium text-zinc-700">
              Business name
            </label>
            <input
              id="businessName"
              name="businessName"
              required
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-zinc-700">
              Category
            </label>
            <select id="category" name="category" required className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2">
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-zinc-700">
              Short description
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={2}
              placeholder="Genuine sneakers, delivery countrywide, est. 2022."
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="contactUrl" className="block text-sm font-medium text-zinc-700">
              Link (their Instagram/TikTok/website)
            </label>
            <input
              id="contactUrl"
              name="contactUrl"
              type="url"
              required
              placeholder="https://instagram.com/realshoesKE"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="logo" className="block text-sm font-medium text-zinc-700">
              Logo (optional)
            </label>
            <input id="logo" name="logo" type="file" accept="image/*" className="mt-1 text-sm" />
          </div>

          <button type="submit" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white">
            Add advertiser
          </button>
        </form>

        <section className="mt-8 space-y-3">
          {advertisers.length === 0 ? (
            <p className="text-zinc-500">No advertisers yet.</p>
          ) : (
            advertisers.map((advertiser) => (
              <div key={advertiser.id} className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4">
                <div>
                  <p className="font-medium text-zinc-900">
                    {advertiser.business_name}{' '}
                    <span className="text-xs font-normal uppercase text-zinc-400">
                      {CATEGORY_LABELS[advertiser.category]}
                    </span>
                  </p>
                  <p className="text-sm text-zinc-600">{advertiser.description}</p>
                  <a href={advertiser.contact_url} className="text-sm text-zinc-500 underline" target="_blank" rel="noreferrer">
                    {advertiser.contact_url}
                  </a>
                </div>
                <form action={toggleAdvertiserActive}>
                  <input type="hidden" name="advertiserId" value={advertiser.id} />
                  <input type="hidden" name="nextActive" value={(!advertiser.is_active).toString()} />
                  <button
                    type="submit"
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                      advertiser.is_active ? 'border-red-300 text-red-700' : 'border-emerald-300 text-emerald-700'
                    }`}
                  >
                    {advertiser.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </form>
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  )
}
