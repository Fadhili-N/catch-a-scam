import type { IdentifierType, Platform } from '@/lib/types'

export interface IdentifierRow {
  id: string
  type: IdentifierType
  value: string
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
  promisedItem: string
  amountLost: string
  incidentDate: string
  narrative: string
  identifiers: IdentifierRow[]
  evidence: EvidenceItem[]
}

export const PLATFORM_LABELS: Record<Platform, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
  facebook: 'Facebook',
  other: 'Other',
}

export function newIdentifierRow(): IdentifierRow {
  return { id: crypto.randomUUID(), type: 'phone', value: '' }
}

export const STEP_LABELS = ['The seller & what happened', 'Payment or contact details', 'Evidence', 'Review & submit']
