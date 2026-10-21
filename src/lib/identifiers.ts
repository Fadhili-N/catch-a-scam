// Turns whatever a reporter typed into the canonical form stored in
// identifiers.normalized_value. This column is the whole point of the
// `identifiers` table (see 0001_init.sql): it's what lets a brand-new scam
// handle be linked back to an old, already-exposed one, by noticing they
// cite the same till or WhatsApp number. That only works if both reports
// normalize their numbers to the same string, so this file is a small but
// load-bearing piece of the product.

import type { IdentifierType } from '@/lib/types'

export interface NormalizeResult {
  ok: boolean
  normalized: string
  error?: string
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '')
}

/**
 * Kenyan mobile numbers arrive in at least four shapes for the same number:
 * 0712345678, 712345678, 254712345678, +254712345678. All four normalize to
 * +254712345678.
 */
function normalizePhone(raw: string): NormalizeResult {
  const digits = digitsOnly(raw)

  let nineDigits: string
  if (digits.length === 9) {
    nineDigits = digits
  } else if (digits.length === 10 && digits.startsWith('0')) {
    nineDigits = digits.slice(1)
  } else if (digits.length === 12 && digits.startsWith('254')) {
    nineDigits = digits.slice(3)
  } else {
    return { ok: false, normalized: '', error: 'Enter a Kenyan phone number, e.g. 0712345678.' }
  }

  if (!/^[17]\d{8}$/.test(nineDigits)) {
    return { ok: false, normalized: '', error: 'That does not look like a Kenyan mobile number.' }
  }

  return { ok: true, normalized: `+254${nineDigits}` }
}

/** Till and paybill numbers: digits only, no leading zero stripped — the
 * number itself is the identifier, unlike a phone number's country code. */
function normalizeTillOrPaybill(raw: string): NormalizeResult {
  const digits = digitsOnly(raw)
  if (digits.length < 5 || digits.length > 10) {
    return { ok: false, normalized: '', error: 'Enter the till/paybill number as shown at checkout.' }
  }
  return { ok: true, normalized: digits }
}

function normalizeBankAccount(raw: string): NormalizeResult {
  const cleaned = raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  if (cleaned.length < 4) {
    return { ok: false, normalized: '', error: 'That account number looks too short.' }
  }
  return { ok: true, normalized: cleaned }
}

/** The name M-Pesa shows on a till/paybill — compared case- and
 * spacing-insensitively, since the same name gets typed inconsistently
 * ("JOHN  DOE" vs "John Doe"). */
function normalizeMpesaName(raw: string): NormalizeResult {
  const cleaned = raw.trim().replace(/\s+/g, ' ').toUpperCase()
  if (cleaned.length < 2) {
    return { ok: false, normalized: '', error: 'Enter the name as it appeared on M-Pesa.' }
  }
  return { ok: true, normalized: cleaned }
}

export function normalizeIdentifier(type: IdentifierType, raw: string): NormalizeResult {
  const trimmed = raw.trim()
  if (!trimmed) {
    return { ok: false, normalized: '', error: 'This field cannot be empty.' }
  }

  switch (type) {
    case 'phone':
    case 'whatsapp':
      return normalizePhone(trimmed)
    case 'till':
    case 'paybill':
      return normalizeTillOrPaybill(trimmed)
    case 'bank_account':
      return normalizeBankAccount(trimmed)
    case 'mpesa_name':
      return normalizeMpesaName(trimmed)
  }
}
