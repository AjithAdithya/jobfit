// Greenhouse public API — no API key required.
// https://developers.greenhouse.io/job-board.html

import TurndownService from 'turndown'
import type { NormalizedJob } from './types'
import { inferRoleFamily } from './inferRoleFamily'
import { inferSeniority } from './inferSeniority'

const td = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-' })

function htmlToText(html: string): string {
  try { return td.turndown(html).trim() } catch { return html }
}

function inferLocationType(location: string | null): NormalizedJob['location_type'] {
  if (!location) return 'unknown'
  const l = location.toLowerCase()
  if (/remote/i.test(l)) return 'remote'
  if (/hybrid/i.test(l)) return 'hybrid'
  if (location.trim()) return 'onsite'
  return 'unknown'
}

export async function fetchGreenhouse(boardToken: string, company: string): Promise<NormalizedJob[]> {
  const url = `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs?content=true`
  const res = await fetch(url, { headers: { 'User-Agent': 'JobFit/1.0' }, signal: AbortSignal.timeout(15000) })

  if (!res.ok) throw new Error(`Greenhouse ${boardToken}: HTTP ${res.status}`)

  const { jobs } = await res.json() as { jobs: any[] }
  if (!Array.isArray(jobs)) return []

  return jobs.map((job): NormalizedJob => {
    const description = job.content ? htmlToText(job.content) : (job.description ?? '')
    const location: string | null = job.location?.name ?? null

    return {
      source: 'greenhouse',
      source_id: String(job.id),
      source_url: job.absolute_url ?? `https://boards.greenhouse.io/${boardToken}/jobs/${job.id}`,
      company,
      job_title: job.title ?? 'Unknown Role',
      job_description: description,
      location,
      location_type: inferLocationType(location),
      comp_min: null,
      comp_max: null,
      comp_currency: 'USD',
      role_family: inferRoleFamily(job.title ?? '', description),
      seniority: inferSeniority(job.title ?? ''),
      posted_at: job.updated_at ?? new Date().toISOString(),
      expires_at: null,
    }
  })
}
