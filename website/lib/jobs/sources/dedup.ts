import { createHash } from 'crypto'

const LEVEL_RE = /^(?:sr\.?\s+|senior\s+|jr\.?\s+|junior\s+|lead\s+|staff\s+|principal\s+|associate\s+)/i

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(LEVEL_RE, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeCompany(company: string): string {
  return company
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeLocation(location: string | null): string {
  if (!location) return ''
  return location
    .toLowerCase()
    .replace(/[^a-z0-9,\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Stable dedup hash for cross-board merging. */
export function dedupHash(company: string, title: string, location: string | null): string {
  const key = [normalizeCompany(company), normalizeTitle(title), normalizeLocation(location)].join('|')
  return createHash('sha1').update(key).digest('hex')
}

/** Content hash — used to detect upstream JD edits. */
export function descriptionHash(jobDescription: string): string {
  return createHash('sha1').update(jobDescription.trim()).digest('hex')
}
