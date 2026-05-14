import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: score, error: scoreErr } = await supabase
      .from('job_scores')
      .select('*, curated_jobs(*)')
      .eq('job_id', params.id)
      .eq('user_id', user.id)
      .eq('stale', false)
      .maybeSingle()

    if (scoreErr) throw scoreErr
    // Don't leak existence of unscored jobs to the client.
    if (!score) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ job: score })
  } catch (err: any) {
    console.error('[api/jobs/[id] GET]', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
