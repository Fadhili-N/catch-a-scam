'use client'

import { useState } from 'react'
import type { Category, Platform } from '@/lib/types'
import { CATEGORY_LABELS, PLATFORM_LABELS } from './types'
import { EvidenceThumbnail } from './evidence-thumbnail'

const MAX_PRODUCT_PHOTO_BYTES = 8 * 1024 * 1024

interface Fields {
  platform: Platform
  handle: string
  displayName: string
  category: Category
  promisedItem: string
  amountLost: string
  incidentDate: string
  narrative: string
  productPhoto: File | null
}

interface StepDetailsProps {
  value: Fields
  onChange: (patch: Partial<Fields>) => void
  errors: Record<string, string>
}

export function StepDetails({ value, onChange, errors }: StepDetailsProps) {
  const [photoPickError, setPhotoPickError] = useState<string | null>(null)

  function handlePhotoPicked(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setPhotoPickError("That isn't an image.")
      return
    }
    if (file.size > MAX_PRODUCT_PHOTO_BYTES) {
      setPhotoPickError('That image is too large (max 8MB).')
      return
    }
    setPhotoPickError(null)
    onChange({ productPhoto: file })
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="platform" className="block text-sm font-medium text-zinc-700">
          Platform
        </label>
        <select
          id="platform"
          value={value.platform}
          onChange={(e) => onChange({ platform: e.target.value as Platform })}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
        >
          {Object.entries(PLATFORM_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="handle" className="block text-sm font-medium text-zinc-700">
          Their handle
        </label>
        <input
          id="handle"
          value={value.handle}
          onChange={(e) => onChange({ handle: e.target.value.replace(/^@/, '') })}
          placeholder="shoeplug.ke"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
        />
        {errors.handle && <p className="mt-1 text-sm text-red-600">{errors.handle}</p>}
      </div>

      <div>
        <label htmlFor="displayName" className="block text-sm font-medium text-zinc-700">
          Page name shown (optional)
        </label>
        <input
          id="displayName"
          value={value.displayName}
          onChange={(e) => onChange({ displayName: e.target.value })}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="promisedItem" className="block text-sm font-medium text-zinc-700">
          What were they selling?
        </label>
        <input
          id="promisedItem"
          value={value.promisedItem}
          onChange={(e) => onChange({ promisedItem: e.target.value })}
          placeholder="Nike Air Force 1, size 42"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
        />
        {errors.promisedItem && <p className="mt-1 text-sm text-red-600">{errors.promisedItem}</p>}
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-zinc-700">
          Category
        </label>
        <select
          id="category"
          value={value.category}
          onChange={(e) => onChange({ category: e.target.value as Category })}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
        >
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">Product photo (optional)</label>
        <p className="mt-1 text-xs text-zinc-500">
          A screenshot of <strong>their own post</strong> for this item — not your private chat or payment.
          This one is shown publicly, so it needs no redaction, but make sure it&rsquo;s just the product.
        </p>
        {value.productPhoto ? (
          <div className="mt-2">
            <EvidenceThumbnail blob={value.productPhoto} onRemove={() => onChange({ productPhoto: null })} />
          </div>
        ) : (
          <input type="file" accept="image/*" onChange={handlePhotoPicked} className="mt-2 text-sm" />
        )}
        {photoPickError && <p className="mt-1 text-sm text-red-600">{photoPickError}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="amountLost" className="block text-sm font-medium text-zinc-700">
            Amount paid, KES (optional)
          </label>
          <input
            id="amountLost"
            inputMode="decimal"
            value={value.amountLost}
            onChange={(e) => onChange({ amountLost: e.target.value })}
            placeholder="2500"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
          />
          {errors.amountLost && <p className="mt-1 text-sm text-red-600">{errors.amountLost}</p>}
        </div>
        <div>
          <label htmlFor="incidentDate" className="block text-sm font-medium text-zinc-700">
            When? (optional)
          </label>
          <input
            id="incidentDate"
            type="date"
            value={value.incidentDate}
            onChange={(e) => onChange({ incidentDate: e.target.value })}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
          />
          {errors.incidentDate && <p className="mt-1 text-sm text-red-600">{errors.incidentDate}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="narrative" className="block text-sm font-medium text-zinc-700">
          What happened?
        </label>
        <textarea
          id="narrative"
          rows={5}
          value={value.narrative}
          onChange={(e) => onChange({ narrative: e.target.value })}
          placeholder="I messaged them about the shoes, they asked me to pay a deposit via till 123456 before shipping, then stopped replying and blocked me once I paid."
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
        />
        {errors.narrative && <p className="mt-1 text-sm text-red-600">{errors.narrative}</p>}
      </div>
    </div>
  )
}
