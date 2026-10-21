'use client'

import { useEffect, useRef, useState } from 'react'

interface Rect {
  x: number
  y: number
  width: number
  height: number
}

interface RedactCanvasProps {
  file: File
  onConfirm: (redacted: Blob) => void
  onCancel: () => void
}

/**
 * Lets someone black out their own name/number/balance on a screenshot
 * before it ever leaves their browser. The canvas is kept at the image's
 * full natural resolution at all times — only its on-screen CSS size
 * shrinks to fit — so pointer coordinates are converted from "displayed
 * pixels" to "canvas pixels" on every draw, and the final export is just
 * whatever the canvas already contains: no second, hidden full-res canvas
 * needed.
 *
 * README principle 4 ("evidence is required, and redacted") is enforced
 * here, not just suggested: the confirm button stays disabled until the
 * uploader has drawn at least one box, or explicitly says there was
 * nothing to redact.
 */
export function RedactCanvas({ file, onConfirm, onCancel }: RedactCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const [rects, setRects] = useState<Rect[]>([])
  const [draft, setDraft] = useState<Rect | null>(null)
  const dragStart = useRef<{ x: number; y: number } | null>(null)
  const [noPersonalInfo, setNoPersonalInfo] = useState(false)
  const [imageReady, setImageReady] = useState(false)

  // Load the file into an <img>, then size the canvas to its natural
  // (full) resolution exactly once.
  useEffect(() => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      imageRef.current = img
      const canvas = canvasRef.current
      if (canvas) {
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
      }
      setImageReady(true)
    }
    img.src = url
    return () => URL.revokeObjectURL(url)
  }, [file])

  // Redraw: the image, every committed box, and the box currently being
  // dragged (if any). Runs whenever any of those change.
  useEffect(() => {
    const canvas = canvasRef.current
    const img = imageRef.current
    if (!canvas || !img || !imageReady) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    ctx.fillStyle = '#000'
    for (const r of rects) ctx.fillRect(r.x, r.y, r.width, r.height)
    if (draft) ctx.fillRect(draft.x, draft.y, draft.width, draft.height)
  }, [rects, draft, imageReady])

  function toCanvasCoords(event: React.PointerEvent<HTMLCanvasElement>): { x: number; y: number } {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    }
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    dragStart.current = toCanvasCoords(event)
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!dragStart.current) return
    const current = toCanvasCoords(event)
    const start = dragStart.current
    setDraft({
      x: Math.min(start.x, current.x),
      y: Math.min(start.y, current.y),
      width: Math.abs(current.x - start.x),
      height: Math.abs(current.y - start.y),
    })
  }

  function handlePointerUp() {
    dragStart.current = null
    setDraft((pending) => {
      // A box smaller than this is almost certainly an accidental tap, not
      // a deliberate redaction — drop it rather than committing a no-op box.
      if (pending && pending.width > 4 && pending.height > 4) {
        setRects((prev) => [...prev, pending])
      }
      return null
    })
  }

  function undoLast() {
    setRects((prev) => prev.slice(0, -1))
  }

  function handleConfirm() {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob(
      (blob) => {
        if (blob) onConfirm(blob)
      },
      'image/png'
    )
  }

  const canConfirm = rects.length > 0 || noPersonalInfo

  return (
    <div className="rounded-lg border border-zinc-300 bg-white p-4">
      <p className="text-sm text-zinc-600">
        Click and drag to black out your name, phone number, or balance before this is uploaded.
      </p>

      <div className="mt-3 overflow-hidden rounded border border-zinc-200">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="block w-full max-w-full touch-none"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
        <button
          type="button"
          onClick={undoLast}
          disabled={rects.length === 0}
          className="rounded border border-zinc-300 px-3 py-1.5 disabled:opacity-40"
        >
          Undo last box
        </button>
        <span className="text-zinc-500">
          {rects.length} box{rects.length === 1 ? '' : 'es'} drawn
        </span>
      </div>

      <label className="mt-3 flex items-start gap-2 text-sm text-zinc-700">
        <input
          type="checkbox"
          checked={noPersonalInfo}
          onChange={(e) => setNoPersonalInfo(e.target.checked)}
          className="mt-0.5"
        />
        This screenshot has no personal information visible — nothing to black out.
      </label>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium"
        >
          Remove this image
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!canConfirm}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          Use this screenshot
        </button>
      </div>
    </div>
  )
}
