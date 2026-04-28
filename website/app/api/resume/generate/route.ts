import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildResumeGraph } from '@/lib/graph/graph'

export const maxDuration = 120

interface GenerateBody {
  jobTitle: string
  companyName?: string
  selectedGaps: string[]
  selectedKeywords: string[]
  resumeContext: string
  userFeedback?: string
}

/**
 * POST /api/resume/generate
 *
 * Streams Server-Sent Events as each graph node completes:
 *   event: node   data: { node: string, state: Partial<state> }
 *   event: done   data: { html: string, guardianResult, writerRetries, coverageScore }
 *   event: error  data: { error: string }
 *
 * The client can render progress ("Writing resume...", "Critiquing coverage...", etc.)
 * and receive the final HTML without polling.
 */
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  let body: GenerateBody
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 })
  }

  const { jobTitle, companyName, selectedGaps, selectedKeywords, resumeContext, userFeedback } = body
  if (!jobTitle || !resumeContext) {
    return new Response(JSON.stringify({ error: 'jobTitle and resumeContext are required' }), { status: 400 })
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
            jobTitle,
            companyName: companyName ?? '',
            selectedGaps: selectedGaps ?? [],
            selectedKeywords: selectedKeywords ?? [],
            userId: user.id,
            userFeedback,
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
          // update shape: { [nodeName]: partialState }
          for (const [nodeName, partial] of Object.entries(update)) {
            emit('node', { node: nodeName, state: partial })
            finalState = { ...finalState, ...(partial as object) }
          }
        }

        emit('done', {
          html: finalState.generatedHtml ?? '',
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
