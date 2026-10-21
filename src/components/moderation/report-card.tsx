import { formatMoney, formatDate, IDENTIFIER_LABELS } from '@/lib/format'
import type { Account, Evidence, Identifier, Report } from '@/lib/types'
import { approveReport, rejectReport } from '@/app/moderate/actions'

export type ReportForModeration = Report & {
  accounts: Account
  identifiers: Identifier[]
  evidence: Evidence[]
}

export function ReportCard({
  report,
  evidenceUrls,
}: {
  report: ReportForModeration
  evidenceUrls: Record<string, string>
}) {
  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex items-baseline justify-between">
        <p className="font-medium text-zinc-900">
          @{report.accounts.handle} <span className="text-xs uppercase text-zinc-400">{report.accounts.platform}</span>
        </p>
        <span className="text-xs text-zinc-400">{formatDate(report.created_at.slice(0, 10))}</span>
      </div>

      <p className="mt-2 text-sm text-zinc-900">{report.promised_item}</p>
      <p className="mt-1 text-sm text-zinc-600">{report.narrative}</p>
      <p className="mt-2 text-sm text-zinc-500">
        {formatMoney(report.amount_lost, report.currency)} · {formatDate(report.incident_date)}
      </p>

      {report.identifiers.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2">
          {report.identifiers.map((id) => (
            <li key={id.id} className="rounded bg-zinc-100 px-2 py-1 text-xs text-zinc-600">
              {IDENTIFIER_LABELS[id.type] ?? id.type}: {id.raw_value} <span className="text-zinc-400">({id.normalized_value})</span>
            </li>
          ))}
        </ul>
      )}

      {report.evidence.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {report.evidence.map((item) => {
            const url = evidenceUrls[item.id]
            return url ? (
              // eslint-disable-next-line @next/next/no-img-element -- a short-lived signed URL, not a cacheable public image
              <img key={item.id} src={url} alt="Submitted evidence" className="h-24 w-24 rounded border border-zinc-200 object-cover" />
            ) : (
              <span key={item.id} className="text-xs text-red-600">
                evidence image failed to load
              </span>
            )
          })}
        </div>
      )}

      {report.status === 'pending' ? (
        <div className="mt-4 flex flex-wrap items-start gap-2">
          <form action={approveReport}>
            <input type="hidden" name="reportId" value={report.id} />
            <button type="submit" className="rounded-lg bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white">
              Approve
            </button>
          </form>

          <form action={rejectReport} className="flex flex-1 gap-2">
            <input type="hidden" name="reportId" value={report.id} />
            <input
              type="text"
              name="note"
              placeholder="Reason (shown to no one but kept for the record)"
              className="flex-1 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
            />
            <button type="submit" className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700">
              Reject
            </button>
          </form>
        </div>
      ) : (
        <p className="mt-4 text-xs text-zinc-400">
          {report.status === 'approved' ? 'Approved' : 'Rejected'}
          {report.moderator_note ? ` — ${report.moderator_note}` : ''}
        </p>
      )}
    </article>
  )
}
