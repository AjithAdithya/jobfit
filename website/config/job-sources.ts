import type { JobSource } from '../lib/jobs/sources/types'

// Hand-curated seed list of tech companies with public Greenhouse/Lever/Ashby boards.
// All sources are ToS-clean (public APIs, no scraping).
// Expand this list; dedup_hash ensures cross-board duplicates collapse to one row.

export const JOB_SOURCES: JobSource[] = [
  // ── Greenhouse ─────────────────────────────────────────────────────────────
  { name: 'Stripe',        type: 'greenhouse', id: 'stripe',        company: 'Stripe' },
  { name: 'Airbnb',        type: 'greenhouse', id: 'airbnb',        company: 'Airbnb' },
  { name: 'Databricks',    type: 'greenhouse', id: 'databricks',    company: 'Databricks' },
  { name: 'Figma',         type: 'greenhouse', id: 'figma',         company: 'Figma' },
  { name: 'Notion',        type: 'greenhouse', id: 'notion',        company: 'Notion' },
  { name: 'Airtable',      type: 'greenhouse', id: 'airtable',      company: 'Airtable' },
  { name: 'Brex',          type: 'greenhouse', id: 'brex',          company: 'Brex' },
  { name: 'Plaid',         type: 'greenhouse', id: 'plaid',         company: 'Plaid' },
  { name: 'Scale AI',      type: 'greenhouse', id: 'scaleai',       company: 'Scale AI' },
  { name: 'Benchling',     type: 'greenhouse', id: 'benchling',     company: 'Benchling' },

  // ── Lever ──────────────────────────────────────────────────────────────────
  { name: 'Vercel',        type: 'lever', id: 'vercel',        company: 'Vercel' },
  { name: 'Linear',        type: 'lever', id: 'linear',        company: 'Linear' },
  { name: 'Retool',        type: 'lever', id: 'retool',        company: 'Retool' },
  { name: 'Loom',          type: 'lever', id: 'loom',          company: 'Loom' },
  { name: 'Anduril',       type: 'lever', id: 'anduril',       company: 'Anduril' },

  // ── Ashby ──────────────────────────────────────────────────────────────────
  { name: 'Anthropic',     type: 'ashby', id: 'anthropic',     company: 'Anthropic' },
  { name: 'Perplexity',    type: 'ashby', id: 'perplexity',    company: 'Perplexity AI' },
  { name: 'Cursor',        type: 'ashby', id: 'cursor',        company: 'Cursor' },
  { name: 'Codeium',       type: 'ashby', id: 'codeium',       company: 'Codeium' },
  { name: 'Windsurf',      type: 'ashby', id: 'windsurf',      company: 'Windsurf' },
]
