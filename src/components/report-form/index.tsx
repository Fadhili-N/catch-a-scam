'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { normalizeIdentifier } from '@/lib/identifiers'
import { reportDetailsSchema, validateAmountLost, validateIncidentDate } from '@/lib/validation/report'
import type { Account } from '@/lib/types'
import { StepDetails } from './step-details'
import { StepIdentifiers } from './step-identifiers'
import { StepEvidence } from './step-evidence'
import { StepReview } from './step-review'
import { newIdentifierRow, STEP_LABELS, type ReportFormState } from './types'

const initialState: ReportFormState = {
  platform: 'tiktok',
  handle: '',
  displayName: '',
  promisedItem: '',
  amountLost: '',
  incidentDate: '',
  narrative: '',
  identifiers: [newIdentifierRow()],
  evidence: [],
}

/**
 * Four-step wizard: details -> identifiers -> evidence -> review/submit.
 * All state lives here; each step is a "dumb" controlled component that
 * just renders `value` and calls `onChange`, which keeps the validation
 * and submission logic in one place rather than spread across files.
 *
 * Submission is a sequence of plain client-side Supabase calls rather than
 * one wrapped transaction — every insert is already scoped by Row Level
 * Security to "this is my own report", so the worst failure mode is a
 * half-filed pending report with, say, no evidence attached, which a
 * moderator simply rejects. True atomicity would need a server-side
 * function, which is more machinery than this risk currently justifies.
 */
export function ReportForm() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [done, setDone] = useState(false)
  const [state, setState] = useState<ReportFormState>(initialState)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  function patch(fields: Partial<ReportFormState>) {
    setState((prev) => ({ ...prev, ...fields }))
  }

  function validateStep1(): Record<string, string> {
    const result = reportDetailsSchema.safeParse(state)
    const found: Record<string, string> = {}
    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0]
        if (typeof field === 'string' && !found[field]) found[field] = issue.message
      }
    }
    const amountError = validateAmountLost(state.amountLost)
    if (amountError) found.amountLost = amountError
    const dateError = validateIncidentDate(state.incidentDate)
    if (dateError) found.incidentDate = dateError
    return found
  }

  function validateStep2(): Record<string, string> {
    const found: Record<string, string> = {}
    for (const row of state.identifiers) {
      const result = normalizeIdentifier(row.type, row.value)
      if (!result.ok) found[row.id] = result.error ?? 'Invalid value.'
    }
    return found
  }

  function validateStep3(): Record<string, string> {
    const readyCount = state.evidence.filter((item) => item.status === 'ready').length
    return readyCount === 0 ? { evidence: 'Add at least one screenshot and confirm its redaction.' } : {}
  }

  function handleNext() {
    const found = step === 1 ? validateStep1() : step === 2 ? validateStep2() : validateStep3()
    if (Object.keys(found).length > 0) {
      setErrors(found)
      return
    }
    setErrors({})
    setStep((s) => (s < 4 ? ((s + 1) as 2 | 3 | 4) : s))
  }

  function handleBack() {
    setErrors({})
    setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s))
  }

  async function handleSubmit() {
    setSubmitting(true)
    setSubmitError(null)

    try {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Your session expired — please log in again before submitting.')

      const parsed = reportDetailsSchema.parse(state)

      const { data: accountData, error: accountError } = await supabase.rpc('find_or_create_account', {
        platform_in: parsed.platform,
        handle_in: parsed.handle,
        display_name_in: parsed.displayName || null,
      })
      if (accountError) throw new Error(accountError.message)
      const account = (Array.isArray(accountData) ? accountData[0] : accountData) as Account

      const { data: report, error: reportError } = await supabase
        .from('reports')
        .insert({
          account_id: account.id,
          reporter_id: user.id,
          amount_lost: state.amountLost ? Number(state.amountLost) : null,
          currency: 'KES',
          incident_date: state.incidentDate || null,
          promised_item: parsed.promisedItem,
          narrative: parsed.narrative,
        })
        .select()
        .single()
      if (reportError) throw new Error(reportError.message)

      const identifierRows = state.identifiers.map((row) => {
        const normalized = normalizeIdentifier(row.type, row.value)
        return {
          report_id: report.id,
          type: row.type,
          raw_value: row.value.trim(),
          normalized_value: normalized.normalized,
        }
      })
      const { error: identifiersError } = await supabase.from('identifiers').insert(identifierRows)
      if (identifiersError) throw new Error(identifiersError.message)

      for (const item of state.evidence) {
        if (item.status !== 'ready' || !item.blob) continue
        const path = `${report.id}/${crypto.randomUUID()}.png`
        const { error: uploadError } = await supabase.storage.from('evidence').upload(path, item.blob, {
          contentType: 'image/png',
        })
        if (uploadError) throw new Error(uploadError.message)

        const { error: evidenceError } = await supabase.from('evidence').insert({
          report_id: report.id,
          storage_path: path,
          reporter_confirmed_redacted: true,
        })
        if (evidenceError) throw new Error(evidenceError.message)
      }

      setDone(true)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="text-xl font-bold text-zinc-900">Report submitted</h2>
        <p className="mt-2 text-zinc-600">
          Thanks for documenting this. A moderator will review it before it appears publicly — that
          usually takes a little while, since every report is checked by a person, not published
          automatically.
        </p>
        <button onClick={() => router.push('/')} className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white">
          Back to home
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm text-zinc-500">
          Step {step} of 4: {STEP_LABELS[step - 1]}
        </p>
        <div className="mt-2 h-1.5 w-full rounded-full bg-zinc-200">
          <div
            className="h-1.5 rounded-full bg-zinc-900 transition-all"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      {step === 1 && <StepDetails value={state} onChange={patch} errors={errors} />}
      {step === 2 && (
        <StepIdentifiers
          rows={state.identifiers}
          onChange={(identifiers) => patch({ identifiers })}
          errors={errors}
        />
      )}
      {step === 3 && (
        <>
          <StepEvidence items={state.evidence} onChange={(evidence) => patch({ evidence })} />
          {errors.evidence && <p className="mt-2 text-sm text-red-600">{errors.evidence}</p>}
        </>
      )}
      {step === 4 && (
        <StepReview value={state} submitting={submitting} submitError={submitError} onSubmit={handleSubmit} />
      )}

      {step < 4 && (
        <div className="mt-6 flex justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 1}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium disabled:opacity-40"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
          >
            Next
          </button>
        </div>
      )}
      {step === 4 && (
        <button type="button" onClick={handleBack} className="mt-4 text-sm text-zinc-500 underline">
          ← Back to edit
        </button>
      )}
    </div>
  )
}
