import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('user_job_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) throw error
    return NextResponse.json({ preferences: data })
  } catch (err: any) {
    console.error('[preferences GET]', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()

    // Only allow known preference fields through — never let callers set user_id or embeddings.
    const allowed = [
      'roles_of_interest', 'locations', 'remote_ok', 'hybrid_ok', 'onsite_ok',
      'comp_min', 'seniority_floor', 'seniority_ceiling', 'excluded_companies',
      'active_resume_id', 'notify_email',
    ] as const

    const patch: Record<string, unknown> = { user_id: user.id, updated_at: new Date().toISOString() }
    for (const key of allowed) {
      if (key in body) patch[key] = body[key]
    }

    // Changing active_resume_id invalidates the profile embedding — clear it so fan-out rebuilds.
    if ('active_resume_id' in body) {
      patch.profile_embedding = null
      patch.profile_embedding_at = null
    }

    const { data, error } = await supabase
      .from('user_job_preferences')
      .upsert(patch, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ preferences: data })
  } catch (err: any) {
    console.error('[preferences PATCH]', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
