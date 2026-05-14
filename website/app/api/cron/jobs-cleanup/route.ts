import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

const DEACTIVATE_DAYS = 35
const DELETE_DAYS = 90

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Deactivate jobs older than 35 days
  const deactivateCutoff = new Date(Date.now() - DEACTIVATE_DAYS * 86400_000).toISOString()
  const { count: deactivated, error: deactivateErr } = await supabase
    .from('curated_jobs')
    .update({ active: false })
    .eq('active', true)
    .lt('posted_at', deactivateCutoff)
    .select('id')

  if (deactivateErr) console.error('[jobs-cleanup] deactivate error:', deactivateErr)

  // Hard-delete jobs older than 90 days (cascade purges job_scores via FK)
  const deleteCutoff = new Date(Date.now() - DELETE_DAYS * 86400_000).toISOString()
  const { count: deleted, error: deleteErr } = await supabase
    .from('curated_jobs')
    .delete({ count: 'exact' })
    .lt('posted_at', deleteCutoff)

  if (deleteErr) console.error('[jobs-cleanup] delete error:', deleteErr)

  return NextResponse.json({
    ok: true,
    deactivated: deactivated ?? 0,
    deleted: deleted ?? 0,
  })
}
