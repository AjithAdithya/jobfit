import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractProfileFromResume } from '@/lib/graph/profileExtractor'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { resumeId } = await req.json()
  if (!resumeId) return NextResponse.json({ error: 'resumeId required' }, { status: 400 })

  // Verify the resume belongs to this user
  const { data: resume } = await supabase
    .from('resumes')
    .select('id')
    .eq('id', resumeId)
    .eq('user_id', user.id)
    .single()
  if (!resume) return NextResponse.json({ error: 'Resume not found' }, { status: 404 })

  // Fetch chunks to reconstruct resume text
  const { data: chunks } = await supabase
    .from('resume_chunkies')
    .select('content')
    .eq('resume_id', resumeId)
    .order('section')
  if (!chunks?.length) return NextResponse.json({ error: 'No content found in resume' }, { status: 422 })

  const text = chunks.map(c => c.content).join('\n\n')
  const fields = await extractProfileFromResume(text)

  return NextResponse.json(fields)
}
