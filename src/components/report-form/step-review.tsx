import { IDENTIFIER_LABELS } from '@/lib/format'
import { CATEGORY_LABELS, PLATFORM_LABELS, type ReportFormState } from './types'

interface StepReviewProps {
  value: ReportFormState
  submitting: boolean
  submitError: string | null
  onSubmit: () => void
}

export function StepReview({ value, submitting, submitError, onSubmit }: StepReviewProps) {
  return (
    <div className="space-y-4">
      <dl className="space-y-2 rounded-lg border border-zinc-200 bg-white p-4 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-zinc-500">Account</dt>
          <dd className="text-right text-zinc-900">
            @{value.handle} · {PLATFORM_LABELS[value.platform]}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-zinc-500">Item</dt>
          <dd className="text-right text-zinc-900">
            {value.promisedItem} <span className="text-zinc-400">({CATEGORY_LABELS[value.category]})</span>
          </dd>
        </div>
        {value.amountLost && (
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Amount paid</dt>
            <dd className="text-right text-zinc-900">KES {value.amountLost}</dd>
          </div>
        )}
        <div className="flex justify-between gap-4">
          <dt className="text-zinc-500">Identifiers</dt>
          <dd className="text-right text-zinc-900">
            {value.identifiers.map((row) => (
              <div key={row.id}>
                {IDENTIFIER_LABELS[row.type]}: {row.value}
              </div>
            ))}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-zinc-500">Evidence</dt>
          <dd className="text-right text-zinc-900">{value.evidence.length} screenshot(s)</dd>
        </div>
      </dl>

      <p className="text-xs text-zinc-500">
        A moderator reviews every report before it becomes public. Filing a false report about a real
        business is not what this site is for, and reports are shown as allegations, not as proven fact.
      </p>

      {submitError && <p className="text-sm text-red-600">{submitError}</p>}

      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting}
        className="w-full rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white disabled:opacity-50"
      >
        {submitting ? 'Submitting…' : 'Submit report'}
      </button>
    </div>
  )
}
