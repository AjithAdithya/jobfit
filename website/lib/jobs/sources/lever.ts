// Lever public posting API — no API key required.
// https://hire.lever.co/developer/postings

import TurndownService from 'turndown'
import type { NormalizedJob } from './types'
import { inferRoleFamily } from './inferRoleFamily'
import { inferSeniority } from './inferSeniority'

const td = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-' })

function htmlToText(html: string): string {
  try { return td.turndown(html).trim() } catch { return html }
}

function inferLocationType(commitment: string | null, location: string | null): NormalizedJob['location_type'] {
  const hay = `${commitment ?? ''} ${location ?? ''}`.toLowerCase()
  if (/remote/i.test(hay)) return 'remote'
  if (/hybrid/i.test(hay)) return 'hybrid'
  if (location?.trim()) return 'onsite'
  return 'unknown'
}

export async function fetchLever(orgSlug: string, company: string): Promise<NormalizedJob[]> {
  const url = `https://api.lever.co/v0/postings/${orgSlug}?mode=json`
  const res = await fetch(url, { headers: { 'User-Agent': 'JobFit/1.0' }, signal: AbortSignal.timeout(15000) })

  if (!res.ok) throw new Error(`Lever ${orgSlug}: HTTP ${res.status}`)

  const postings = await res.json() as any[]
  if (!Array.isArray(postings)) return []

  return postings.map((p): NormalizedJob => {
    const descParts: string[] = []
    if (p.descriptionPlain) descParts.push(p.descriptionPlain)
    else if (p.description) descParts.push(htmlToText(p.description))

    if (Array.isArray(p.lists)) {
      for (const list of p.lists) {
        if (list.text) descParts.push(`\n## ${list.text}`)
        if (list.content) descParts.push(htmlToText(list.content))
      }
    }
    if (p.additional) descParts.push(htmlToText(p.additional))

    const description = descParts.join('\n\n').trim()
    const location: string | null = p.categories?.location ?? null
    const commitment: string | null = p.categories?.commitment ?? null

    return {
      source: 'lever',
      source_id: p.id ?? String(Date.now()),
      source_url: p.hostedUrl ?? `https://jobs.lever.co/${orgSlug}/${p.id}`,
      company,
      job_title: p.text ?? 'Unknown Role',
      job_description: description,
      location,
      location_type: inferLocationType(commitment, location),
      comp_min: null,
      comp_max: null,
      comp_currency: 'USD',
      role_family: inferRoleFamily(p.text ?? '', description),
      seniority: inferSeniority(p.text ?? ''),
      posted_at: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
      expires_at: null,
    }
  })
}
