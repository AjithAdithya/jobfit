// Workable public job listing API — no API key required for public boards.
// https://workable.com/api/accounts/{subdomain}/jobs

import TurndownService from 'turndown'
import type { NormalizedJob } from './types'
import { inferRoleFamily } from './inferRoleFamily'
import { inferSeniority } from './inferSeniority'

const td = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-' })

function htmlToText(html: string): string {
  try { return td.turndown(html).trim() } catch { return html }
}

function inferLocationType(telecommuting: boolean | null, location: string | null): NormalizedJob['location_type'] {
  if (telecommuting) return 'remote'
  const l = (location ?? '').toLowerCase()
  if (/remote/i.test(l)) return 'remote'
  if (/hybrid/i.test(l)) return 'hybrid'
  if (location?.trim()) return 'onsite'
  return 'unknown'
}

export async function fetchWorkable(subdomain: string, company: string): Promise<NormalizedJob[]> {
  const url = `https://apply.workable.com/api/v3/accounts/${subdomain}/jobs`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'JobFit/1.0' },
    body: JSON.stringify({ query: '', location: [], department: [], worktype: [], remote: [] }),
    signal: AbortSignal.timeout(15000),
  })

  if (!res.ok) throw new Error(`Workable ${subdomain}: HTTP ${res.status}`)

  const data = await res.json() as { results?: any[] }
  const results = data.results ?? []
  if (!Array.isArray(results)) return []

  // Workable list endpoint lacks full descriptions — fetch each individually.
  const jobs = await Promise.allSettled(
    results.slice(0, 50).map(async (job): Promise<NormalizedJob> => {
      const detailUrl = `https://apply.workable.com/api/v3/accounts/${subdomain}/jobs/${job.shortcode}`
      let description = job.description ?? ''

      try {
        const detailRes = await fetch(detailUrl, { signal: AbortSignal.timeout(10000) })
        if (detailRes.ok) {
          const detail = await detailRes.json() as any
          const parts: string[] = []
          if (detail.description) parts.push(htmlToText(detail.description))
          if (detail.requirements) parts.push('## Requirements\n' + htmlToText(detail.requirements))
          if (detail.benefits) parts.push('## Benefits\n' + htmlToText(detail.benefits))
          description = parts.join('\n\n')
        }
      } catch { /* use list-level description */ }

      const location: string | null = job.location?.city ?? job.location?.country ?? null

      return {
        source: 'workable',
        source_id: job.shortcode ?? job.id,
        source_url: job.url ?? `https://apply.workable.com/${subdomain}/j/${job.shortcode}`,
        company,
        job_title: job.title ?? 'Unknown Role',
        job_description: description,
        location,
        location_type: inferLocationType(job.telecommuting ?? null, location),
        comp_min: null,
        comp_max: null,
        comp_currency: 'USD',
        role_family: inferRoleFamily(job.title ?? '', description),
        seniority: inferSeniority(job.title ?? ''),
        posted_at: job.published_on ?? new Date().toISOString(),
        expires_at: null,
      }
    })
  )

  return jobs.filter((r): r is PromiseFulfilledResult<NormalizedJob> => r.status === 'fulfilled').map(r => r.value)
}
