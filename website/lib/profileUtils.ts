export interface UserProfile {
  user_id: string
  full_name: string | null
  headline: string | null
  bio: string | null
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
}

const SCORED_FIELDS: (keyof UserProfile)[] = [
  'full_name', 'headline', 'bio',
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

export function completenessColor(pct: number): string {
  if (pct >= 80) return 'bg-ink-900'
  if (pct >= 40) return 'bg-citrus'
  return 'bg-flare'
}

export function completenessLabel(pct: number): string {
  if (pct >= 80) return 'strong'
  if (pct >= 40) return 'in progress'
  return 'incomplete'
}
