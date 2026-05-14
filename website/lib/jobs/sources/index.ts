import type { JobSource, NormalizedJob, SourceResult } from './types'
import { fetchGreenhouse } from './greenhouse'
import { fetchLever } from './lever'
import { fetchAshby } from './ashby'
import { fetchWorkable } from './workable'
import { dedupHash, descriptionHash } from './dedup'

export type { NormalizedJob, SourceResult, JobSource }

async function fetchFromSource(source: JobSource): Promise<NormalizedJob[]> {
  const company = source.company ?? source.id
  switch (source.type) {
    case 'greenhouse': return fetchGreenhouse(source.id, company)
    case 'lever':      return fetchLever(source.id, company)
    case 'ashby':      return fetchAshby(source.id, company)
    case 'workable':   return fetchWorkable(source.id, company)
    default:           return []
  }
}

export interface IngestRow {
  source: NormalizedJob['source']
  source_id: string
  source_url: string
  dedup_hash: string
  description_hash: string
  company: string
  job_title: string
  job_description: string
  location: string | null
  location_type: string
  comp_min: number | null
  comp_max: number | null
  comp_currency: string
  role_family: string | null
  seniority: string
  posted_at: string
  expires_at: string | null
  active: boolean
}

function toIngestRow(job: NormalizedJob): IngestRow {
  return {
    source:           job.source,
    source_id:        job.source_id,
    source_url:       job.source_url,
    dedup_hash:       dedupHash(job.company, job.job_title, job.location),
    description_hash: descriptionHash(job.job_description),
    company:          job.company,
    job_title:        job.job_title,
    job_description:  job.job_description,
    location:         job.location,
    location_type:    job.location_type,
    comp_min:         job.comp_min,
    comp_max:         job.comp_max,
    comp_currency:    job.comp_currency,
    role_family:      job.role_family,
    seniority:        job.seniority,
    posted_at:        job.posted_at,
    expires_at:       job.expires_at,
    active:           true,
  }
}

export async function runAllSources(
  sources: JobSource[]
): Promise<{ results: SourceResult[]; rows: IngestRow[] }> {
  const results: SourceResult[] = []
  const rows: IngestRow[] = []

  await Promise.allSettled(
    sources.map(async source => {
      try {
        const jobs = await fetchFromSource(source)
        const ingestRows = jobs.map(toIngestRow)
        rows.push(...ingestRows)
        results.push({ name: source.name, ok: true, count: jobs.length })
      } catch (err: any) {
        console.error(`[ingest] ${source.name} failed:`, err.message)
        results.push({ name: source.name, ok: false, count: 0, error: err.message })
      }
    })
  )

  return { results, rows }
}
