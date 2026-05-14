export interface NormalizedJob {
  source: 'greenhouse' | 'lever' | 'workable' | 'ashby' | 'rss' | 'manual'
  source_id: string
  source_url: string
  company: string
  job_title: string
  job_description: string
  location: string | null
  location_type: 'remote' | 'hybrid' | 'onsite' | 'unknown'
  comp_min: number | null
  comp_max: number | null
  comp_currency: string
  role_family: string | null
  seniority: 'intern' | 'junior' | 'mid' | 'senior' | 'staff' | 'principal' | 'exec' | 'unknown'
  posted_at: string  // ISO 8601
  expires_at: string | null
}

export interface SourceResult {
  name: string
  ok: boolean
  count: number
  error?: string
}

export interface JobSource {
  name: string
  type: 'greenhouse' | 'lever' | 'workable' | 'ashby' | 'rss'
  /** Board token / org slug / URL depending on type */
  id: string
  /** Human-readable company name override (optional — adapters derive from API when possible) */
  company?: string
}
