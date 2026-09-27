// Inserts a small set of clearly-labelled EXAMPLE rows so Phase 2's pages
// have something real to render, before any genuine reports exist.
//
// Uses the SERVICE ROLE key, which bypasses Row Level Security. That is
// necessary here: we need to insert rows already in their "approved" /
// "public" state, which no ordinary signed-up user is allowed to do
// directly (only a moderator action can flip that switch).
//
// This script is a standalone Node script. It is never imported into the
// Next.js app and never runs in the browser — the service role key never
// reaches a browser.
//
// Run it by hand from the project root:
//
//   node --env-file=.env.local scripts/seed.mjs
//
// The two accounts below deliberately share one till number, to
// demonstrate the account-linking feature: report a new handle, and if
// its payment number matches an older, already-reported handle, the
// profile page surfaces that connection automatically.
//
// Remove everything this script creates with:
//
//   node --env-file=.env.local scripts/unseed.mjs

import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(url, serviceKey)

const SEED_TAG = '[SEED TEST DATA]'
const SHARED_TILL = '5551234'

async function upsertAccount(platform, handle, displayName) {
  const { data, error } = await supabase
    .from('accounts')
    .upsert(
      { platform, handle, display_name: displayName, is_public: true },
      { onConflict: 'platform,handle' }
    )
    .select()
    .single()
  if (error) throw error
  return data
}

async function insertReport(accountId, fields) {
  const { data, error } = await supabase
    .from('reports')
    .insert({ account_id: accountId, status: 'approved', ...fields })
    .select()
    .single()
  if (error) throw error
  return data
}

async function insertIdentifiers(reportId, rows) {
  const { error } = await supabase
    .from('identifiers')
    .insert(rows.map((row) => ({ report_id: reportId, ...row })))
  if (error) throw error
}

async function main() {
  const accountA = await upsertAccount(
    'tiktok',
    'test_shoeplug_ke',
    `Shoe Plug Kenya ${SEED_TAG}`
  )

  const reportA = await insertReport(accountA.id, {
    amount_lost: 3500,
    currency: 'KES',
    incident_date: '2026-06-14',
    promised_item: 'Nike Air Force 1 (white, size 42)',
    narrative: `${SEED_TAG} Paid via till after a week of WhatsApp chat and photos of the shoes. Blocked immediately after the payment confirmation was sent.`,
  })

  await insertIdentifiers(reportA.id, [
    { type: 'till', raw_value: SHARED_TILL, normalized_value: SHARED_TILL },
    { type: 'whatsapp', raw_value: '0712345678', normalized_value: '+254712345678' },
  ])

  const accountB = await upsertAccount(
    'instagram',
    'test_shoeplugkenya254',
    `ShoePlug Kenya 254 ${SEED_TAG}`
  )

  const reportB = await insertReport(accountB.id, {
    amount_lost: 2800,
    currency: 'KES',
    incident_date: '2026-08-02',
    promised_item: 'Adidas Superstar sneakers',
    narrative: `${SEED_TAG} Same pattern as everyone else here: beautiful product photos, moved to WhatsApp, sent money to a till, then silence.`,
  })

  await insertIdentifiers(reportB.id, [
    { type: 'till', raw_value: SHARED_TILL, normalized_value: SHARED_TILL },
  ])

  console.log('Seeded 2 test accounts and 2 test reports, both citing till', SHARED_TILL)
  console.log(`  - @${accountA.handle} (${accountA.platform})`)
  console.log(`  - @${accountB.handle} (${accountB.platform})`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
