import { z } from 'zod'

// Validates only the plain-text fields of the report form. Identifiers have
// their own, per-type validation in src/lib/identifiers.ts, and evidence is
// validated by simple length/status checks in the form itself — neither
// fits naturally into one flat object schema, so they're kept separate
// rather than forced in here.
export const reportDetailsSchema = z.object({
  platform: z.enum(['tiktok', 'instagram', 'whatsapp', 'facebook', 'other']),
  // Powers the "legit sellers like this" sponsored placement on the
  // account page (0007_advertisers.sql) — matching an advertiser's own
  // category against this, not against free-text promisedItem.
  category: z.enum(['shoes', 'clothing', 'electronics', 'beauty', 'accessories', 'other']),
  handle: z
    .string()
    .trim()
    .min(2, 'Enter the handle as it appears on their page.')
    .max(60, 'That handle looks too long — check for a pasting mistake.'),
  displayName: z.string().trim().max(120, 'Keep the display name under 120 characters.').optional(),
  promisedItem: z.string().trim().min(2, 'Say what they were selling.').max(200, 'Keep this under 200 characters.'),
  narrative: z
    .string()
    .trim()
    .min(30, 'Please add a bit more detail — at least 30 characters.')
    .max(4000, 'Keep the story under 4000 characters.'),
})

export type ReportDetailsInput = z.infer<typeof reportDetailsSchema>

/** amountLost and incidentDate are both optional, so they're validated
 * separately from the schema above rather than forced into it with
 * awkward union types. */
export function validateAmountLost(raw: string): string | null {
  if (!raw.trim()) return null
  const value = Number(raw)
  if (!Number.isFinite(value) || value <= 0) {
    return 'Enter the amount you paid, in KES, or leave this blank.'
  }
  return null
}

export function validateIncidentDate(raw: string): string | null {
  if (!raw.trim()) return null
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return 'Enter a valid date.'
  if (date.getTime() > Date.now()) return 'That date is in the future.'
  return null
}
