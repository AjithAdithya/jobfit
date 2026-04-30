import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

export async function DELETE() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Revoke the Google OAuth grant before deleting — must happen while session still exists
  const { data: { session } } = await supabase.auth.getSession()
  const providerToken = session?.provider_token
  if (providerToken) {
    try {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${providerToken}`, { method: 'POST' })
    } catch {
      // Ignore — token may be expired; auth.identities is cascade-deleted with the user record
    }
  }

  // Remove all uploaded PDF files
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

  // Delete the auth user — requires service role key
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) {
    console.error('deleteUser failed:', error)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
