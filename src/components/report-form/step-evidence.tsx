'use client'

import { useState } from 'react'
import { RedactCanvas } from '@/components/redact-canvas'
import { EvidenceThumbnail } from './evidence-thumbnail'
import type { EvidenceItem } from './types'

const MAX_FILE_BYTES = 8 * 1024 * 1024 // 8MB — generous for a phone screenshot, small enough to upload quickly

interface StepEvidenceProps {
  items: EvidenceItem[]
  onChange: (items: EvidenceItem[]) => void
}

export function StepEvidence({ items, onChange }: StepEvidenceProps) {
  const [pickError, setPickError] = useState<string | null>(null)

  function handleFilesPicked(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = '' // allow re-picking the same file later if it gets removed

    const accepted: EvidenceItem[] = []
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setPickError(`${file.name} isn't an image — only screenshots are accepted.`)
        continue
      }
      if (file.size > MAX_FILE_BYTES) {
        setPickError(`${file.name} is too large (max 8MB).`)
        continue
      }
      accepted.push({ id: crypto.randomUUID(), file, status: 'needs_redaction' })
    }
    if (accepted.length > 0) setPickError(null)
    onChange([...items, ...accepted])
  }

  function removeItem(id: string) {
    onChange(items.filter((item) => item.id !== id))
  }

  function markReady(id: string, blob: Blob) {
    onChange(items.map((item) => (item.id === id ? { ...item, status: 'ready', blob } : item)))
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600">
        Upload screenshots of the conversation and the payment confirmation. You&rsquo;ll black out your own
        personal details before each one uploads.
      </p>

      <input type="file" accept="image/*" multiple onChange={handleFilesPicked} className="text-sm" />
      {pickError && <p className="text-sm text-red-600">{pickError}</p>}

      <div className="space-y-4">
        {items.map((item) =>
          item.status === 'needs_redaction' ? (
            <RedactCanvas
              key={item.id}
              file={item.file}
              onConfirm={(blob) => markReady(item.id, blob)}
              onCancel={() => removeItem(item.id)}
            />
          ) : (
            <EvidenceThumbnail key={item.id} blob={item.blob!} onRemove={() => removeItem(item.id)} />
          )
        )}
      </div>
    </div>
  )
}
