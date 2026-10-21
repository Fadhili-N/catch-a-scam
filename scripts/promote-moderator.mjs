// Sets a signed-up user's profile role to 'moderator'. Deliberately a
// standalone script run by hand, not a button anywhere in the app — there
// is no self-serve path to this role, on purpose (see
// prevent_role_escalation in 0001_init.sql, which silently discards any
// attempt to change role except through the service-role connection this
// script uses).
//
// Run it by hand from the project root:
//
//   node --env-file=.env.local scripts/promote-moderator.mjs someone@example.com

import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const email = process.argv[2]

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}
if (!email) {
  console.error('Usage: node --env-file=.env.local scripts/promote-moderator.mjs someone@example.com')
  process.exit(1)
}

const supabase = createClient(url, serviceKey)

async function main() {
  const { data: userList, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) throw listError

  const user = userList.users.find((u) => u.email === email)
  if (!user) {
    console.error(`No signed-up user found with email ${email}. They need to sign up first.`)
    process.exit(1)
  }

  const { error: updateError } = await supabase.from('profiles').update({ role: 'moderator' }).eq('id', user.id)
  if (updateError) throw updateError

  console.log(`${email} is now a moderator.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
