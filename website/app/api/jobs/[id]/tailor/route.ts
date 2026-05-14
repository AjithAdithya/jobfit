import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildResumeGraph } from '@/lib/graph/graph'

export const maxDuration = 120
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  // Fetch the job + this user's score row (for gaps/keywords).
  const { data: scoreRow, error: scoreErr } = await supabase
    .from('job_scores')
    .select('gaps, keywords, curated_jobs(job_title, company, source_url, job_description)')
    .eq('job_id', params.id)
    .eq('user_id', user.id)
    .eq('stale', false)
    .maybeSingle()

  if (scoreErr || !scoreRow) {
    return new Response(JSON.stringify({ error: 'Job not found or not scored yet' }), { status: 404 })
  }

  const job = scoreRow.curated_jobs as any
  const gaps: string[] = scoreRow.gaps ?? []
  const keywords: string[] = scoreRow.keywords ?? []

  // Lookup-or-create an analysis_history row — prevents double-tailor creating duplicates.
  const { data: existing } = await supabase
    .from('analysis_history')
    .select('id')
    .eq('user_id', user.id)
    .eq('job_url', job.source_url)
    .maybeSingle()

  const historyId = existing?.id ?? null

  // Fetch user's active resume context.
  const { data: prefs } = await supabase
    .from('user_job_preferences')
    .select('active_resume_id')
    .eq('user_id', user.id)
    .maybeSingle()

  let resumeContext = ''
  if (prefs?.active_resume_id) {
    const { data: chunks } = await supabase
      .from('resume_chunkies')
      .select('content')
      .eq('resume_id', prefs.active_resume_id)
      .order('chunk_index')
      .limit(30)
    resumeContext = (chunks ?? []).map((c: any) => c.content).join('\n\n')
  }

  const graph = buildResumeGraph({ supabase })

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder()
      const emit = (event: string, data: unknown) => {
        controller.enqueue(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
      }

      try {
        const events = await graph.stream(
          {
            jobTitle: job.job_title,
            companyName: job.company,
            selectedGaps: gaps,
            selectedKeywords: keywords,
            userId: user.id,
            resumeContext,
            companyContext: null,
            generatedHtml: '',
            critique: null,
            guardianResult: null,
            writerRetries: 0,
            guardianRetries: 0,
          },
          { streamMode: 'updates' }
        )

        let finalState: Record<string, unknown> = {}
        for await (const update of events) {
          for (const [nodeName, partial] of Object.entries(update)) {
            emit('node', { node: nodeName, state: partial })
            finalState = { ...finalState, ...(partial as object) }
          }
        }

        const html = (finalState.generatedHtml as string) ?? ''

        // Persist the generated resume to analysis_history or a resume_versions row.
        let versionId: string | null = null
        if (html) {
          if (historyId) {
            await supabase
              .from('analysis_history')
              .update({ generated_resume: html })
              .eq('id', historyId)
            versionId = historyId
          } else {
            const { data: newHistory } = await supabase
              .from('analysis_history')
              .insert({
                user_id: user.id,
                job_title: job.job_title,
                job_url: job.source_url,
                site_name: job.company,
                score: null,
                status: 'Evaluating',
                generated_resume: html,
              })
              .select('id')
              .single()
            versionId = newHistory?.id ?? null
          }
        }

        emit('done', {
          html,
          versionId,
          guardianResult: finalState.guardianResult ?? null,
          writerRetries: finalState.writerRetries ?? 0,
          coverageScore: (finalState.critique as any)?.coverageScore ?? null,
        })
      } catch (err: any) {
        emit('error', { error: err.message ?? 'Graph execution failed' })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
