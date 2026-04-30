import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export interface UserProfile {
  user_id: string
  email: string | null
  full_name: string | null
  headline: string | null
  bio: string | null
  professional_summary: string | null
  target_roles: string[]
  target_industries: string[]
  job_type: string | null
  remote_preference: string | null
  seniority_level: string | null
  years_of_experience: number | null
  location: string | null
  willing_to_relocate: boolean
  visa_status: string | null
  salary_min: number | null
  salary_currency: string
  salary_period: string | null
  linkedin_url: string | null
  github_url: string | null
  portfolio_url: string | null
  onboarding_completed: boolean
}

const SCORED_FIELDS: (keyof UserProfile)[] = [
  'full_name', 'headline', 'bio', 'professional_summary',
  'target_roles', 'target_industries',
  'job_type', 'remote_preference',
  'seniority_level', 'years_of_experience',
  'location', 'visa_status',
  'salary_min', 'salary_period',
  'linkedin_url', 'github_url', 'portfolio_url',
  'willing_to_relocate',
]

export function computeCompleteness(profile: Partial<UserProfile>): number {
  let filled = 0
  for (const key of SCORED_FIELDS) {
    const val = profile[key]
    if (val === null || val === undefined) continue
    if (typeof val === 'string' && val.trim() === '') continue
    if (Array.isArray(val) && val.length === 0) continue
    if (typeof val === 'boolean') { filled++; continue }
    filled++
  }
  return Math.round((filled / SCORED_FIELDS.length) * 100)
}

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)

  useEffect(() => {
    if (!userId) { setLoading(false); return }
    supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
      .then(({ data }) => {
        setProfile(data ?? null)
        setLoading(false)
      })
  }, [userId])

  const save = useCallback(async (patch: Partial<UserProfile>) => {
    if (!userId) return
    setSaving(true)
    const merged = { ...(profile ?? {}), ...patch, user_id: userId, updated_at: new Date().toISOString() }
    const { data } = await supabase
      .from('user_profiles')
      .upsert(merged, { onConflict: 'user_id' })
      .select()
      .single()
    if (data) setProfile(data as UserProfile)
    setSaving(false)
    setSavedAt(Date.now())
  }, [userId, profile])

  const completeness = profile ? computeCompleteness(profile) : 0

  return { profile, loading, saving, savedAt, save, completeness }
}
