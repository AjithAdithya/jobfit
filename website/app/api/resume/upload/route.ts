import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractTextFromPdf } from '@/lib/pdf'
import { chunkText } from '@/lib/processor'
import { generateEmbeddings } from '@/lib/graph/voyage'
import { extractProfileFromResume } from '@/lib/graph/profileExtractor'

const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: `File too large (max 5 MB)` }, { status: 400 })
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())

    // 1. Extract text
    const text = await extractTextFromPdf(buffer)

    // 2. Chunk
    const chunks = chunkText(text)
    if (!chunks.length) throw new Error('No content could be extracted from the PDF.')

    // 3. Embed all chunks in one Voyage call
    const contents = chunks.map(c => c.content)
    const embeddings = await generateEmbeddings(contents)

    // 4. Upload raw PDF to Supabase Storage
    const storagePath = `${user.id}/${Date.now()}.pdf`
    const { error: storageError } = await supabase.storage
      .from('resumes')
      .upload(storagePath, buffer, { contentType: 'application/pdf' })
    if (storageError) throw storageError

    // 5. Insert row into resumes table
    const { data: resume, error: resumeError } = await supabase
      .from('resumes')
      .insert({ user_id: user.id, file_name: file.name, storage_path: storagePath })
      .select()
      .single()
    if (resumeError) throw resumeError

    // 6. Insert chunks into resume_chunkies
    const chunkRows = chunks.map((c, i) => ({
      resume_id: resume.id,
      user_id: user.id,
      section: c.section,
      content: c.content,
      embedding: embeddings[i],
    }))
    const { error: chunksError } = await supabase.from('resume_chunkies').insert(chunkRows)
    if (chunksError) throw chunksError

    // 7. Seed profile from resume — only if this is the user's first resume and no profile exists yet
    const { count: resumeCount } = await supabase
      .from('resumes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .single()

    if (resumeCount === 1 && !existingProfile) {
      // Fire-and-forget — don't block the response
      extractProfileFromResume(text)
        .then(fields => {
          const row = { ...fields, user_id: user.id, updated_at: new Date().toISOString() }
          return supabase.from('user_profiles').upsert(row, { onConflict: 'user_id' })
        })
        .catch(err => console.warn('Profile seed failed (non-fatal):', err))
    }

    return NextResponse.json({
      id: resume.id,
      file_name: resume.file_name,
      created_at: resume.created_at,
      chunks: chunks.length,
    })
  } catch (err: any) {
    console.error('Resume upload error:', err)
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 })
  }
}
