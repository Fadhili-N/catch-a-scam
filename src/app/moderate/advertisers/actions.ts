'use server'

import { revalidatePath } from 'next/cache'
import { requireModerator } from '@/lib/auth'
import type { Category } from '@/lib/types'

/**
 * Both actions rely on RLS alone (no security-definer function needed,
 * unlike set_report_product_photo in 0006) — the single "only moderators
 * manage advertisers" FOR ALL policy in 0007_advertisers.sql already
 * covers every write a moderator makes here. That function-vs-RLS choice
 * only mattered in 0006 because an ORDINARY reporter needed one narrow
 * exception; nobody but a moderator ever touches this table at all.
 */

export async function createAdvertiser(formData: FormData) {
  const { supabase } = await requireModerator()

  const businessName = (formData.get('businessName') as string)?.trim()
  const category = formData.get('category') as Category
  const description = (formData.get('description') as string)?.trim()
  const contactUrl = (formData.get('contactUrl') as string)?.trim()
  const logo = formData.get('logo') as File | null

  if (!businessName || !category || !description || !contactUrl) {
    throw new Error('Business name, category, description, and contact link are all required.')
  }

  const { data: advertiser, error: insertError } = await supabase
    .from('advertisers')
    .insert({ business_name: businessName, category, description, contact_url: contactUrl })
    .select()
    .single()
  if (insertError) throw new Error(insertError.message)

  if (logo && logo.size > 0) {
    const extension = logo.type === 'image/png' ? 'png' : 'jpg'
    const path = `${advertiser.id}/${crypto.randomUUID()}.${extension}`
    const { error: uploadError } = await supabase.storage
      .from('advertiser-logos')
      .upload(path, logo, { contentType: logo.type })
    if (uploadError) throw new Error(uploadError.message)

    const { error: logoPathError } = await supabase
      .from('advertisers')
      .update({ logo_path: path })
      .eq('id', advertiser.id)
      .select()
      .single()
    if (logoPathError) throw new Error(logoPathError.message)
  }

  revalidatePath('/moderate/advertisers')
}

export async function toggleAdvertiserActive(formData: FormData) {
  const { supabase } = await requireModerator()
  const advertiserId = formData.get('advertiserId') as string
  const nextActive = formData.get('nextActive') === 'true'

  const { error } = await supabase
    .from('advertisers')
    .update({ is_active: nextActive })
    .eq('id', advertiserId)
    .select()
    .single()
  if (error) throw new Error(error.message)

  revalidatePath('/moderate/advertisers')
}
