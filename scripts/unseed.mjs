// Removes the example rows created by scripts/seed.mjs.
//
// Deleting an account cascades to its reports, and deleting a report
// cascades to its identifiers and evidence (see the "on delete cascade"
// foreign keys in 0001_init.sql) — so removing these two account rows is
// enough to clean up everything they own.
//
// Run it by hand from the project root:
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

const SEED_ACCOUNTS = [
  { platform: 'tiktok', handle: 'test_shoeplug_ke' },
  { platform: 'instagram', handle: 'test_shoeplugkenya254' },
]

async function main() {
  for (const { platform, handle } of SEED_ACCOUNTS) {
    const { error } = await supabase.from('accounts').delete().eq('platform', platform).eq('handle', handle)
    if (error) throw error
    console.log(`Deleted seed account @${handle} (${platform}) and everything under it`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
