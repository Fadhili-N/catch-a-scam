// Turns whatever a reporter typed into the canonical form stored in
// identifiers.normalized_value. This column is the whole point of the
// `identifiers` table (see 0001_init.sql): it's what lets a brand-new scam
// handle be linked back to an old, already-exposed one, by noticing they
// cite the same till or WhatsApp number. That only works if both reports
// normalize their numbers to the same string, so this file is a small but
// load-bearing piece of the product.

import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js'
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
 * Most scam traffic is Kenyan M-Pesa numbers, but the WhatsApp number
 * doing the actual scamming is sometimes registered abroad (diaspora
 * scams, or a seller routing WhatsApp through a different country than
 * their till). Hand-rolling per-country validation doesn't scale, so this
 * defers to libphonenumber-js, the same library most production apps use
 * for this — `countryCode` is whatever the reporter picked from the
 * dropdown (step-identifiers.tsx), used only to interpret a number typed
 * without its country code; a number typed with a leading + is parsed
 * from that + regardless of which country is selected.
 */
function normalizePhone(raw: string, countryCode: CountryCode): NormalizeResult {
  const parsed = parsePhoneNumberFromString(raw, countryCode)

  if (!parsed || !parsed.isValid()) {
    return { ok: false, normalized: '', error: 'That does not look like a valid phone number for the selected country.' }
  }

  return { ok: true, normalized: parsed.number } // E.164, e.g. +254712345678
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

export function normalizeIdentifier(
  type: IdentifierType,
  raw: string,
  countryCode: CountryCode = 'KE'
): NormalizeResult {
  const trimmed = raw.trim()
  if (!trimmed) {
    return { ok: false, normalized: '', error: 'This field cannot be empty.' }
  }

  switch (type) {
    case 'phone':
    case 'whatsapp':
      return normalizePhone(trimmed, countryCode)
    case 'till':
    case 'paybill':
      return normalizeTillOrPaybill(trimmed)
    case 'bank_account':
      return normalizeBankAccount(trimmed)
    case 'mpesa_name':
      return normalizeMpesaName(trimmed)
  }
}
