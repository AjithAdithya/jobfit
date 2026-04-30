import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Remove all uploaded PDF files for this user
  const { data: files } = await supabase.storage.from('resumes').list(user.id)
  if (files && files.length > 0) {
    const paths = files.map(f => `${user.id}/${f.name}`)
    await supabase.storage.from('resumes').remove(paths)
  }

  // FK children must be deleted before their parents
  await Promise.all([
    supabase.from('resume_chunkies').delete().eq('user_id', user.id),
    supabase.from('resume_versions').delete().eq('user_id', user.id),
    supabase.from('generations').delete().eq('user_id', user.id),
  ])

  await Promise.all([
    supabase.from('resumes').delete().eq('user_id', user.id),
    supabase.from('analysis_history').delete().eq('user_id', user.id),
    supabase.from('user_profiles').delete().eq('user_id', user.id),
    supabase.from('style_presets').delete().eq('user_id', user.id),
  ])

  return NextResponse.json({ ok: true })
}
