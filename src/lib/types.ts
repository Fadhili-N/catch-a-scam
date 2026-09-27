// Hand-written types mirroring the database schema in
// supabase/migrations/0001_init.sql. Kept in sync by hand for now; once the
// Supabase CLI is linked to the project we can generate these instead.

export type Platform = 'tiktok' | 'instagram' | 'whatsapp' | 'facebook' | 'other'
export type ReportStatus = 'pending' | 'approved' | 'rejected'
export type IdentifierType = 'phone' | 'whatsapp' | 'till' | 'paybill' | 'bank_account' | 'mpesa_name'

export interface Account {
  id: string
  platform: Platform
  handle: string
  display_name: string | null
  is_public: boolean
  view_count: number
  created_at: string
}

export interface Report {
  id: string
  account_id: string
  reporter_id: string | null
  amount_lost: number | null
  currency: string
  incident_date: string | null
  promised_item: string | null
  narrative: string
  status: ReportStatus
  moderator_id: string | null
  moderator_note: string | null
  moderated_at: string | null
  created_at: string
}

export interface Identifier {
  id: string
  report_id: string
  type: IdentifierType
  raw_value: string
  normalized_value: string
  created_at: string
}
