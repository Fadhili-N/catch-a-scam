import { IDENTIFIER_LABELS } from '@/lib/format'
import type { IdentifierType } from '@/lib/types'
import { newIdentifierRow, type IdentifierRow } from './types'

interface StepIdentifiersProps {
  rows: IdentifierRow[]
  onChange: (rows: IdentifierRow[]) => void
  errors: Record<string, string>
}

export function StepIdentifiers({ rows, onChange, errors }: StepIdentifiersProps) {
  function updateRow(id: string, patch: Partial<IdentifierRow>) {
    onChange(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)))
  }

  function removeRow(id: string) {
    onChange(rows.filter((row) => row.id !== id))
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600">
        Add every till, paybill, phone, or WhatsApp number involved. This is what lets us notice when a
        rebranded page is really the same seller — add as many as apply.
      </p>

      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.id} className="flex gap-2">
            <select
              value={row.type}
              onChange={(e) => updateRow(row.id, { type: e.target.value as IdentifierType })}
              className="rounded-lg border border-zinc-300 px-2 py-2 text-sm"
            >
              {Object.entries(IDENTIFIER_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            <div className="flex-1">
              <input
                value={row.value}
                onChange={(e) => updateRow(row.id, { value: e.target.value })}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2"
              />
              {errors[row.id] && <p className="mt-1 text-sm text-red-600">{errors[row.id]}</p>}
            </div>
            <button
              type="button"
              onClick={() => removeRow(row.id)}
              disabled={rows.length === 1}
              className="rounded-lg border border-zinc-300 px-3 text-sm disabled:opacity-40"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onChange([...rows, newIdentifierRow()])}
        className="text-sm font-medium text-zinc-900 underline"
      >
        + Add another
      </button>
    </div>
  )
}
