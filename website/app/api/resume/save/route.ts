import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, html } = await req.json()
    if (!id || typeof html !== 'string') {
      return NextResponse.json({ error: 'id and html are required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('analysis_history')
      .update({ generated_resume: html })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Resume save error:', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
