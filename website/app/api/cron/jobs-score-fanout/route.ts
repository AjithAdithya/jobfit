import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateEmbeddings } from '@/lib/graph/voyage'

export const maxDuration = 300
export const dynamic = 'force-dynamic'

// Users with logins older than this are considered inactive and skipped.
const ACTIVE_USER_DAYS = 30
// Max jobs to enqueue per user per cycle.
const MAX_QUEUE_PER_USER = 100
// Profile embedding staleness threshold (days).
const PROFILE_EMBEDDING_TTL_DAYS = 7

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Fetch active users: must have prefs + active_resume_id + recent login.
  const activeThreshold = new Date(Date.now() - ACTIVE_USER_DAYS * 86400_000).toISOString()

  const { data: prefs, error: prefsErr } = await supabase
    .from('user_job_preferences')
    .select('user_id, active_resume_id, profile_embedding, profile_embedding_at')
    .not('active_resume_id', 'is', null)

  if (prefsErr) {
    console.error('[fanout] prefs fetch error:', prefsErr)
    return NextResponse.json({ error: prefsErr.message }, { status: 500 })
  }
  if (!prefs || prefs.length === 0) {
    return NextResponse.json({ ok: true, users: 0, enqueued: 0 })
  }

  // Filter to users active within the threshold (auth.users last_sign_in_at).
  const { data: activeUsers, error: authErr } = await supabase
    .from('users' as any)
    .select('id, last_sign_in_at')
    .in('id', prefs.map(p => p.user_id))
    .gte('last_sign_in_at', activeThreshold)

  if (authErr) console.warn('[fanout] auth.users query failed, proceeding with all pref users:', authErr.message)

  const activeUserIds = new Set<string>(
    activeUsers ? activeUsers.map((u: any) => u.id) : prefs.map(p => p.user_id)
  )

  const activePref = prefs.filter(p => activeUserIds.has(p.user_id))

  let totalEnqueued = 0

  for (const pref of activePref) {
    try {
      // Refresh profile_embedding if stale or missing.
      const embeddingAge = pref.profile_embedding_at
        ? (Date.now() - new Date(pref.profile_embedding_at).getTime()) / 86400_000
        : Infinity

      if (!pref.profile_embedding || embeddingAge > PROFILE_EMBEDDING_TTL_DAYS) {
        // Build a synthetic "profile document" from the resume chunks.
        const { data: chunks } = await supabase
          .from('resume_chunkies')
          .select('content')
          .eq('resume_id', pref.active_resume_id)
          .limit(20)

        const profileText = (chunks ?? []).map((c: any) => c.content).join('\n\n').slice(0, 8000)
        if (profileText.length > 100) {
          const [[embedding]] = await generateEmbeddings([profileText])
          await supabase
            .from('user_job_preferences')
            .update({ profile_embedding: embedding, profile_embedding_at: new Date().toISOString() })
            .eq('user_id', pref.user_id)
          pref.profile_embedding = embedding
        }
      }

      if (!pref.profile_embedding) continue

      // RPC: cosine pre-filter — returns top-N unscored jobs for this user.
      const { data: candidates, error: rpcErr } = await supabase.rpc('top_candidate_jobs', {
        p_user_id: pref.user_id,
        p_limit: MAX_QUEUE_PER_USER,
        p_max_age_days: 35,
      })

      if (rpcErr) { console.error('[fanout] top_candidate_jobs error:', rpcErr); continue }
      if (!candidates || candidates.length === 0) continue

      const queueRows = candidates.map((c: any) => ({
        user_id: pref.user_id,
        job_id: c.job_id,
        resume_id: pref.active_resume_id,
      }))

      const { error: qErr } = await supabase
        .from('scoring_queue')
        .upsert(queueRows, { onConflict: 'user_id,job_id,resume_id', ignoreDuplicates: true })

      if (qErr) console.error('[fanout] queue insert error:', qErr)
      else totalEnqueued += queueRows.length
    } catch (err: any) {
      console.error('[fanout] user error:', pref.user_id, err.message)
    }
  }

  return NextResponse.json({ ok: true, users: activePref.length, enqueued: totalEnqueued })
}
