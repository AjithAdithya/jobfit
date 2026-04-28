import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import ResumeEditor from '@/components/ResumeEditor'

export default async function ResumeEditPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: item } = await supabase
    .from('analysis_history')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!item) notFound()
  if (!item.generated_resume) {
    return (
      <div className="max-w-[800px] mx-auto px-6 py-24 text-center">
        <p className="font-mono text-[10px] text-crimson-500 tracking-caps uppercase mb-4">no resume yet</p>
        <h1 className="font-chunk text-[40px] tracking-tight text-ink-900 mb-3">nothing to edit.</h1>
        <p className="text-ink-500">Generate a resume from this job in the extension first.</p>
      </div>
    )
  }

  let baseResumeText: string | null = null
  if (item.resume_id) {
    const { data: chunks } = await supabase
      .from('resume_chunkies')
      .select('content, section')
      .eq('resume_id', item.resume_id)
    if (chunks?.length) {
      baseResumeText = chunks.map(c => c.content).join('\n\n')
    }
  }

  let baseResumeName: string | null = null
  if (item.resume_id) {
    const { data: resume } = await supabase
      .from('resumes')
      .select('file_name, created_at')
      .eq('id', item.resume_id)
      .maybeSingle()
    if (resume) baseResumeName = resume.file_name
  }

  return (
    <ResumeEditor
      historyId={item.id}
      initialLatex={item.generated_resume}
      jobTitle={item.job_title || 'Untitled role'}
      jobUrl={item.job_url || ''}
      siteName={item.site_name || ''}
      score={item.score || 0}
      keywords={item.keywords || []}
      selectedKeywords={item.selected_keywords || []}
      gaps={item.gaps || []}
      selectedGaps={item.selected_gaps || []}
      matches={item.matches || []}
      baseResumeName={baseResumeName}
      baseResumeText={baseResumeText}
    />
  )
}
