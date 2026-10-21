'use client'

import { useEffect, useMemo } from 'react'

/** Owns the lifecycle of the object URL it displays, so the blob preview
 * doesn't leak memory as items are added and removed from the evidence list.
 * The URL is derived straight from `blob` via useMemo — it's not state that
 * changes independently of props, so computing it in an effect (and then
 * calling setState with the result) would just be an extra render for no
 * reason. The effect here exists only for its cleanup, to revoke the old
 * URL once `blob` changes or the component unmounts. */
export function EvidenceThumbnail({ blob, onRemove }: { blob: Blob; onRemove: () => void }) {
  const url = useMemo(() => URL.createObjectURL(blob), [blob])

  useEffect(() => {
    return () => URL.revokeObjectURL(url)
  }, [url])

  return (
    <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-2">
      {/* eslint-disable-next-line @next/next/no-img-element -- a blob: URL, not an optimizable remote image */}
      <img src={url} alt="Redacted evidence" className="h-16 w-16 rounded object-cover" />
      <span className="flex-1 text-sm text-zinc-600">Redacted and ready to upload</span>
      <button type="button" onClick={onRemove} className="text-sm text-red-600 underline">
        Remove
      </button>
    </div>
  )
}
