import { getCountries, getCountryCallingCode, type CountryCode } from 'libphonenumber-js'
import type { Category, IdentifierType, Platform } from '@/lib/types'
import { CATEGORY_LABELS, PLATFORM_LABELS } from '@/lib/format'

export interface IdentifierRow {
  id: string
  type: IdentifierType
  value: string
  // Only meaningful when type is 'phone' or 'whatsapp' — ignored by
  // normalizeIdentifier for every other type, but always present so a
  // row can freely switch type without losing/needing to reset this.
  countryCode: CountryCode
}

export interface EvidenceItem {
  id: string
  file: File
  status: 'needs_redaction' | 'ready'
  blob?: Blob
}

export interface ReportFormState {
  platform: Platform
  handle: string
  displayName: string
  category: Category
  promisedItem: string
  amountLost: string
  incidentDate: string
  narrative: string
  identifiers: IdentifierRow[]
  evidence: EvidenceItem[]
  // Optional and separate from `evidence`: a screenshot of the SELLER'S
  // OWN public post for this item, not proof of the scam itself — see
  // 0006_product_photo.sql for why this is allowed to be public when
  // evidence never is. No redaction step, because by nature it shouldn't
  // contain the reporter's own personal information to redact.
  productPhoto: File | null
}

export { PLATFORM_LABELS, CATEGORY_LABELS }

export function newIdentifierRow(): IdentifierRow {
  return { id: crypto.randomUUID(), type: 'phone', value: '', countryCode: 'KE' }
}

export const STEP_LABELS = ['The seller & what happened', 'Payment or contact details', 'Evidence', 'Review & submit']

// Most reports are Kenyan numbers, so Kenya sorts first; everything else
// follows alphabetically by display name. Intl.DisplayNames is a browser
// built-in (no extra dependency) — guarded in case it's ever missing,
// falling back to the bare ISO code rather than crashing the form.
const regionNames =
  typeof Intl !== 'undefined' && 'DisplayNames' in Intl ? new Intl.DisplayNames(['en'], { type: 'region' }) : null

export const COUNTRY_OPTIONS: { code: CountryCode; label: string }[] = getCountries()
  .map((code) => ({ code, label: `${regionNames?.of(code) ?? code} (+${getCountryCallingCode(code)})` }))
  .sort((a, b) => (a.code === 'KE' ? -1 : b.code === 'KE' ? 1 : a.label.localeCompare(b.label)))
