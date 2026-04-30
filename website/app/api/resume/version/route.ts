import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { historyId, latex, revisionNote, source } = await req.json()
    if (!historyId || typeof latex !== 'string') {
      return NextResponse.json({ error: 'historyId and latex are required' }, { status: 400 })
    }

    // Confirm ownership of the history item
    const { data: hist } = await supabase
      .from('analysis_history')
      .select('id')
      .eq('id', historyId)
      .eq('user_id', user.id)
      .single()
    if (!hist) return NextResponse.json({ error: 'History not found' }, { status: 404 })

    const { data: latest } = await supabase
      .from('resume_versions')
      .select('version_number')
      .eq('analysis_history_id', historyId)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextVersion = ((latest?.version_number as number | undefined) ?? 0) + 1

    const { data, error } = await supabase
      .from('resume_versions')
      .insert({
        user_id: user.id,
        analysis_history_id: historyId,
        version_number: nextVersion,
        latex,
        revision_note: revisionNote ?? null,
        source: source || 'website',
      })
      .select('id, version_number, created_at')
      .single()

    if (error) throw error
    return NextResponse.json({ version: data })
  } catch (err: any) {
    console.error('Resume version error:', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const historyId = req.nextUrl.searchParams.get('historyId')
    if (!historyId) return NextResponse.json({ error: 'historyId required' }, { status: 400 })

    const { data, error } = await supabase
      .from('resume_versions')
      .select('id, version_number, revision_note, source, created_at, latex, is_selected')
      .eq('analysis_history_id', historyId)
      .eq('user_id', user.id)
      .order('version_number', { ascending: false })

    if (error) throw error
    return NextResponse.json({ versions: data })
  } catch (err: any) {
    console.error('Resume version list error:', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { historyId, versionId } = await req.json()
    if (!historyId || !versionId) {
      return NextResponse.json({ error: 'historyId and versionId are required' }, { status: 400 })
    }

    const { data: hist } = await supabase
      .from('analysis_history')
      .select('id')
      .eq('id', historyId)
      .eq('user_id', user.id)
      .single()
    if (!hist) return NextResponse.json({ error: 'History not found' }, { status: 404 })

    // Unset all, then set the chosen one
    await supabase
      .from('resume_versions')
      .update({ is_selected: false })
      .eq('analysis_history_id', historyId)
      .eq('user_id', user.id)

    const { error } = await supabase
      .from('resume_versions')
      .update({ is_selected: true })
      .eq('id', versionId)
      .eq('user_id', user.id)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Resume version select error:', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
