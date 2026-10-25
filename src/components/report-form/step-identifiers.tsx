import type { CountryCode } from 'libphonenumber-js'
import { IDENTIFIER_LABELS } from '@/lib/format'
import type { IdentifierType } from '@/lib/types'
import { COUNTRY_OPTIONS, newIdentifierRow, type IdentifierRow } from './types'

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
        {rows.map((row) => {
          const isPhoneType = row.type === 'phone' || row.type === 'whatsapp'
          return (
            <div key={row.id} className="rounded-lg border border-zinc-200 p-3">
              <div className="flex flex-wrap gap-2">
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

                {isPhoneType && (
                  <select
                    value={row.countryCode}
                    onChange={(e) => updateRow(row.id, { countryCode: e.target.value as CountryCode })}
                    className="rounded-lg border border-zinc-300 px-2 py-2 text-sm"
                  >
                    {COUNTRY_OPTIONS.map(({ code, label }) => (
                      <option key={code} value={code}>
                        {label}
                      </option>
                    ))}
                  </select>
                )}

                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  disabled={rows.length === 1}
                  className="ml-auto rounded-lg border border-zinc-300 px-3 text-sm disabled:opacity-40"
                >
                  Remove
                </button>
              </div>

              <input
                value={row.value}
                onChange={(e) => updateRow(row.id, { value: e.target.value })}
                placeholder={isPhoneType ? 'e.g. 0712345678' : undefined}
                className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2"
              />
              {errors[row.id] && <p className="mt-1 text-sm text-red-600">{errors[row.id]}</p>}
            </div>
          )
        })}
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
