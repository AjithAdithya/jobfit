import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  // Fetch the resume first to get the storage path and verify ownership
  const { data: resume, error: fetchError } = await supabase
    .from('resumes')
    .select('id, storage_path')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !resume) {
    return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
  }

  // Delete chunks, storage file, and DB row in parallel
  await Promise.all([
    supabase.from('resume_chunkies').delete().eq('resume_id', id),
    resume.storage_path
      ? supabase.storage.from('resumes').remove([resume.storage_path])
      : Promise.resolve(),
  ])

  const { error: deleteError } = await supabase
    .from('resumes')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (deleteError) throw deleteError

  return NextResponse.json({ ok: true })
}
