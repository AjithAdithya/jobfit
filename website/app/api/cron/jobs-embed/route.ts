import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateEmbeddings } from '@/lib/graph/voyage'

export const maxDuration = 300
export const dynamic = 'force-dynamic'

const BATCH_SIZE = 50   // Voyage max per request is 128; 50 is safe for long JDs
const FETCH_LIMIT = 500

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  const { data: jobs, error } = await supabase
    .from('curated_jobs')
    .select('id, job_description')
    .is('job_embedding', null)
    .eq('active', true)
    .limit(FETCH_LIMIT)

  if (error) {
    console.error('[jobs-embed] fetch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!jobs || jobs.length === 0) {
    return NextResponse.json({ ok: true, embedded: 0 })
  }

  let embedded = 0
  let failed = 0

  for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
    const batch = jobs.slice(i, i + BATCH_SIZE)
    try {
      const embeddings = await generateEmbeddings(batch.map(j => j.job_description))

      const updates = batch.map((job, idx) => ({
        id: job.id,
        job_embedding: embeddings[idx],
      }))

      const { error: updateError } = await supabase
        .from('curated_jobs')
        .upsert(updates, { onConflict: 'id' })

      if (updateError) {
        console.error('[jobs-embed] update error:', updateError)
        failed += batch.length
      } else {
        embedded += batch.length
      }
    } catch (err: any) {
      console.error('[jobs-embed] voyage error:', err.message)
      failed += batch.length
    }
  }

  return NextResponse.json({ ok: true, embedded, failed, total: jobs.length })
}
