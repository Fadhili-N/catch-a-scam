import type { Category, IdentifierType, Platform } from '@/lib/types'

export function formatMoney(amount: number | null, currency: string): string {
  if (amount === null) return 'amount not stated'
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(value: string | null): string {
  if (!value) return 'date not stated'
  return new Date(value).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export const IDENTIFIER_LABELS: Record<IdentifierType, string> = {
  phone: 'Phone number',
  whatsapp: 'WhatsApp number',
  till: 'M-Pesa till number',
  paybill: 'Paybill number',
  bank_account: 'Bank account',
  mpesa_name: 'M-Pesa registered name',
}

export const PLATFORM_LABELS: Record<Platform, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
  facebook: 'Facebook',
  other: 'Other',
}

export const CATEGORY_LABELS: Record<Category, string> = {
  shoes: 'Shoes',
  clothing: 'Clothing',
  electronics: 'Electronics',
  beauty: 'Beauty',
  accessories: 'Accessories',
  other: 'Other',
}
