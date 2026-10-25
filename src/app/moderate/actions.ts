'use server'

import { revalidatePath } from 'next/cache'
import { requireModerator } from '@/lib/auth'

/**
 * Server Actions, not client-side Supabase calls like report-form/index.tsx
 * uses. Both are legitimate patterns — RLS protects the database either
 * way — but a moderation action is a plain "click a button, mutate one
 * row, re-render the page" operation with no multi-step client state to
 * manage, which is exactly what Server Actions are for: a <form action={...}>
 * posts straight to a function that runs only on the server, no API route
 * or client JavaScript required to wire up.
 *
 * Each function still re-checks the caller is a moderator before doing
 * anything, even though RLS would also reject the write — defence in
 * depth, and it lets us return a clear error instead of a opaque RLS
 * failure if someone's role was revoked mid-session.
 *
 * Every write below ends in .select().single() rather than a bare
 * .update(). Postgres RLS does not raise an error when it blocks an
 * UPDATE — it just matches zero rows, silently, and a bare .update()
 * reports that as success with no error at all (confirmed against the
 * live project in scripts/_tmp-test-moderation.mjs during this phase: an
 * unauthorized update returned `error: null` while leaving the row
 * completely unchanged). Chaining .select().single() turns that silent
 * no-op into a real, visible error, since .single() requires exactly one
 * row back and throws if RLS left it with none.
 */

/**
 * Asks the Python image-matching service (services/image-matching) to
 * hash this report's evidence and check it against everything else
 * already reported. Best-effort: approval has already fully succeeded by
 * the time this runs, so a down or slow image service should never make
 * the moderator's "Approve" click look like it failed. A 10s timeout
 * guards against a hung request blocking the response — this is a plain
 * fetch, not a true background job, which matters on a serverless host:
 * an un-awaited promise can be killed the instant the response is sent,
 * so "fire and forget" would risk the call never actually completing.
 */
async function triggerImageAnalysis(reportId: string) {
  const url = process.env.IMAGE_MATCHING_SERVICE_URL
  const secret = process.env.IMAGE_MATCHING_SERVICE_SECRET
  if (!url || !secret) return // not configured — treated as "feature not enabled", not an error

  try {
    await fetch(`${url}/internal/reports/${reportId}/analyze`, {
      method: 'POST',
      headers: { 'X-Internal-Secret': secret },
      signal: AbortSignal.timeout(10_000),
    })
  } catch (err) {
    console.error('Image matching service call failed (non-fatal):', err)
  }
}

export async function approveReport(formData: FormData) {
  const reportId = formData.get('reportId') as string
  const { supabase, user } = await requireModerator()

  const { data: report, error: fetchError } = await supabase
    .from('reports')
    .select('account_id')
    .eq('id', reportId)
    .single()
  if (fetchError) throw new Error(fetchError.message)

  const { error: updateError } = await supabase
    .from('reports')
    .update({
      status: 'approved',
      moderator_id: user.id,
      moderated_at: new Date().toISOString(),
    })
    .eq('id', reportId)
    .select()
    .single()
  if (updateError) throw new Error(updateError.message)

  // Flips the account public the first time any of its reports is
  // approved. Harmless to run again on an account that's already public —
  // just an update to the same value — so no need to check first.
  const { error: accountError } = await supabase
    .from('accounts')
    .update({ is_public: true })
    .eq('id', report.account_id)
    .select()
    .single()
  if (accountError) throw new Error(accountError.message)

  await triggerImageAnalysis(reportId)

  revalidatePath('/moderate')
}

export async function rejectReport(formData: FormData) {
  const reportId = formData.get('reportId') as string
  const note = (formData.get('note') as string | null)?.trim() || null
  const { supabase, user } = await requireModerator()

  const { error } = await supabase
    .from('reports')
    .update({
      status: 'rejected',
      moderator_id: user.id,
      moderator_note: note,
      moderated_at: new Date().toISOString(),
    })
    .eq('id', reportId)
    .select()
    .single()
  if (error) throw new Error(error.message)

  revalidatePath('/moderate')
}
