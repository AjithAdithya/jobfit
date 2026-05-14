// Ashby public job board API — no API key required.
// https://developers.ashbyhq.com/docs/job-postings-api

import TurndownService from 'turndown'
import type { NormalizedJob } from './types'
import { inferRoleFamily } from './inferRoleFamily'
import { inferSeniority } from './inferSeniority'

const td = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-' })

function htmlToText(html: string): string {
  try { return td.turndown(html).trim() } catch { return html }
}

function inferLocationType(location: string | null, isRemote: boolean | null): NormalizedJob['location_type'] {
  if (isRemote) return 'remote'
  const l = (location ?? '').toLowerCase()
  if (/remote/i.test(l)) return 'remote'
  if (/hybrid/i.test(l)) return 'hybrid'
  if (location?.trim()) return 'onsite'
  return 'unknown'
}

export async function fetchAshby(orgSlug: string, company: string): Promise<NormalizedJob[]> {
  const url = `https://api.ashbyhq.com/posting-api/job-board/${orgSlug}`
  const res = await fetch(url, { headers: { 'User-Agent': 'JobFit/1.0' }, signal: AbortSignal.timeout(15000) })

  if (!res.ok) throw new Error(`Ashby ${orgSlug}: HTTP ${res.status}`)

  const data = await res.json() as { jobs?: any[] }
  const jobs = data.jobs ?? []
  if (!Array.isArray(jobs)) return []

  return jobs.map((job): NormalizedJob => {
    const description = job.descriptionHtml
      ? htmlToText(job.descriptionHtml)
      : (job.descriptionPlain ?? '')

    const location: string | null = job.location ?? null
    const isRemote: boolean | null = job.isRemote ?? null

    return {
      source: 'ashby',
      source_id: job.id ?? job.jobPostingId ?? String(Date.now()),
      source_url: job.jobUrl ?? `https://jobs.ashbyhq.com/${orgSlug}/${job.id}`,
      company,
      job_title: job.title ?? 'Unknown Role',
      job_description: description,
      location,
      location_type: inferLocationType(location, isRemote),
      comp_min: job.compensationTierSummary?.minValue ?? null,
      comp_max: job.compensationTierSummary?.maxValue ?? null,
      comp_currency: job.compensationTierSummary?.currency ?? 'USD',
      role_family: inferRoleFamily(job.title ?? '', description),
      seniority: inferSeniority(job.title ?? ''),
      posted_at: job.publishedAt ?? job.updatedAt ?? new Date().toISOString(),
      expires_at: null,
    }
  })
}
