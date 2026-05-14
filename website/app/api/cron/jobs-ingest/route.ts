import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { runAllSources, type IngestRow } from '@/lib/jobs/sources/index'
import { JOB_SOURCES } from '@/config/job-sources'

export const maxDuration = 300  // 5 min (Vercel Pro)
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const { results, rows } = await runAllSources(JOB_SOURCES)

  if (rows.length === 0) {
    return NextResponse.json({ ok: true, results, ingested: 0, deduped: 0 })
  }

  // Batch UPSERT in chunks of 100 to stay within Postgres payload limits.
  // ON CONFLICT (source, source_id): update title/description/hash.
  // When description_hash changes, null the embedding → jobs-embed picks it up.
  let ingested = 0
  let deduped = 0
  const chunkSize = 100

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk: IngestRow[] = rows.slice(i, i + chunkSize)

    const { error, count } = await supabase
      .from('curated_jobs')
      .upsert(
        chunk.map(row => ({
          ...row,
          // Null embedding when JD body changes — jobs-embed will re-embed.
          job_embedding: undefined,
        })),
        {
          onConflict: 'source,source_id',
          ignoreDuplicates: false,
          count: 'exact',
        }
      )

    if (error) {
      console.error('[jobs-ingest] upsert error:', error)
    } else {
      ingested += count ?? chunk.length
    }

    // Count cross-board dedup collisions (rows that hit the dedup_hash unique constraint).
    // We detect these as rows where count < chunk.length after filtering ON CONFLICT (dedup_hash).
    const { count: existingDedup } = await supabase
      .from('curated_jobs')
      .select('id', { count: 'exact', head: true })
      .in('dedup_hash', chunk.map(r => r.dedup_hash))

    deduped += Math.max(0, chunk.length - (existingDedup ?? chunk.length))
  }

  // Null embeddings for rows where description_hash changed — the trigger handles
  // stale-marking job_scores; we handle job_embedding here via a targeted UPDATE.
  const { error: staleMark } = await supabase.rpc('nullify_stale_embeddings' as any)
  // If this RPC doesn't exist yet, we skip silently — the embed cron picks up NULL rows anyway.
  if (staleMark) console.warn('[jobs-ingest] nullify_stale_embeddings skipped:', staleMark.message)

  return NextResponse.json({ ok: true, results, ingested, deduped })
}
