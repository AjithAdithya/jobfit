import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const locationFilter = searchParams.get('loc') || null
    const scoreFloor    = parseInt(searchParams.get('score') ?? '0', 10)
    const roleFamily    = searchParams.get('role') || null
    const source        = searchParams.get('source') || null
    const maxAge        = parseInt(searchParams.get('age') ?? '35', 10)
    const savedOnly     = searchParams.get('saved') === 'true' ? true : null
    const limit         = Math.min(parseInt(searchParams.get('limit') ?? '25', 10), 100)
    const offset        = parseInt(searchParams.get('offset') ?? '0', 10)

    const { data, error } = await supabase.rpc('list_user_jobs', {
      p_user_id:        user.id,
      p_location_type:  locationFilter,
      p_score_floor:    isNaN(scoreFloor) ? 0 : scoreFloor,
      p_role_family:    roleFamily,
      p_source:         source,
      p_max_age_days:   isNaN(maxAge) ? 35 : maxAge,
      p_include_hidden: false,
      p_include_saved:  savedOnly,
      p_limit:          isNaN(limit) ? 25 : limit,
      p_offset:         isNaN(offset) ? 0 : offset,
    })

    if (error) throw error
    return NextResponse.json({ jobs: data ?? [] })
  } catch (err: any) {
    console.error('[api/jobs GET]', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
