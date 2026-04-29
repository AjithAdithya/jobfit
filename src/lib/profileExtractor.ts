import { callClaudeWithTool } from './anthropic'
import type { UserProfile } from '../hooks/useProfile'

const EXTRACTION_TOOL = {
  name: 'extract_profile',
  description: 'Extract candidate profile information from resume text.',
  input_schema: {
    type: 'object' as const,
    properties: {
      full_name: { type: 'string' },
      headline: { type: 'string', description: 'Current or most recent job title, max 120 chars' },
      location: { type: 'string' },
      linkedin_url: { type: 'string' },
      github_url: { type: 'string' },
      portfolio_url: { type: 'string' },
      years_of_experience: { type: 'number', description: 'Total years of professional experience' },
      seniority_level: {
        type: 'string',
        enum: ['entry', 'mid', 'senior', 'staff', 'lead', 'principal', 'director', 'vp', 'c_suite'],
      },
      target_roles: {
        type: 'array',
        items: { type: 'string' },
        description: 'Up to 3 role titles that best represent this candidate',
      },
      target_industries: {
        type: 'array',
        items: {
          type: 'string',
          enum: [
            'Software', 'Fintech', 'Healthcare', 'E-commerce', 'EdTech',
            'Gaming', 'Cybersecurity', 'Data & AI', 'DevTools', 'Consumer',
            'Enterprise SaaS', 'Climate', 'Media', 'Consulting', 'Government', 'Other',
          ],
        },
        description: 'Up to 3 industries inferred from companies and domains worked in',
      },
    },
    required: [],
  },
}

const SYSTEM = `You extract structured candidate profile data from resume text.
Only extract information clearly present. For inferred fields use best judgment.
Return null/omit fields not determinable from the text.`

interface ExtractedProfile {
  full_name?: string | null
  headline?: string | null
  location?: string | null
  linkedin_url?: string | null
  github_url?: string | null
  portfolio_url?: string | null
  years_of_experience?: number | null
  seniority_level?: string | null
  target_roles?: string[]
  target_industries?: string[]
}

export async function extractProfileFromResume(resumeText: string): Promise<Partial<UserProfile>> {
  const trimmed = resumeText.slice(0, 6000)
  const extracted = await callClaudeWithTool<ExtractedProfile>(
    SYSTEM,
    `Extract profile information from this resume:\n\n${trimmed}`,
    EXTRACTION_TOOL,
    { model: 'claude-haiku-4-5', maxTokens: 1024 },
  )

  const profile: Partial<UserProfile> = {}
  if (extracted.full_name) profile.full_name = extracted.full_name
  if (extracted.headline) profile.headline = extracted.headline.slice(0, 120)
  if (extracted.location) profile.location = extracted.location
  if (extracted.linkedin_url) profile.linkedin_url = extracted.linkedin_url
  if (extracted.github_url) profile.github_url = extracted.github_url
  if (extracted.portfolio_url) profile.portfolio_url = extracted.portfolio_url
  if (extracted.years_of_experience != null) {
    profile.years_of_experience = Math.min(30, Math.max(0, Math.round(extracted.years_of_experience)))
  }
  if (extracted.seniority_level) profile.seniority_level = extracted.seniority_level
  if (extracted.target_roles?.length) profile.target_roles = extracted.target_roles.slice(0, 5)
  if (extracted.target_industries?.length) profile.target_industries = extracted.target_industries.slice(0, 5)

  return profile
}
