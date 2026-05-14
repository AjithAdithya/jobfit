'use client'

import { useState } from 'react'
import { Wand2 } from 'lucide-react'

interface Props {
  jobId: string
  jobTitle: string
  company: string
}

export default function TailorPanel({ jobId, jobTitle, company }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [versionId, setVersionId] = useState<string | null>(null)

  const tailor = async () => {
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch(`/api/jobs/${jobId}/tailor`, { method: 'POST' })
      if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error || 'Tailor failed')
      }

      // Stream SSE events
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) throw new Error('No response body')

      let done = false
      while (!done) {
        const { value, done: streamDone } = await reader.read()
        done = streamDone
        if (!value) continue

        const lines = decoder.decode(value).split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const evt = JSON.parse(line.slice(6))
              if (evt.type === 'done' && evt.versionId) {
                setVersionId(evt.versionId)
              }
            } catch { /* partial line */ }
          }
        }
      }

      setStatus('done')
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong')
      setStatus('error')
    }
  }

  return (
    <div className="border border-ink-200 p-6">
      <p className="font-mono text-[10px] tracking-caps uppercase text-ink-400 mb-3">resume tailoring</p>
      <p className="font-serif italic text-[14px] text-ink-600 mb-5">
        generate a version of your resume tailored specifically to <strong>{jobTitle}</strong> at {company}.
      </p>

      {status === 'idle' && (
        <button
          onClick={tailor}
          className="flex items-center gap-2 px-5 py-3 bg-ink-900 text-cream font-mono text-[11px] tracking-caps uppercase hover:bg-ink-800 transition-colors"
        >
          <Wand2 className="w-4 h-4" />
          tailor resume
        </button>
      )}

      {status === 'loading' && (
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-crimson-500 animate-pulse" />
          <span className="font-mono text-[11px] text-ink-600">tailoring your resume…</span>
        </div>
      )}

      {status === 'done' && versionId && (
        <div className="space-y-3">
          <p className="font-mono text-[11px] text-citrus-600 tracking-caps uppercase">resume ready</p>
          <a
            href={`/dashboard/resume/${versionId}`}
            className="inline-block px-5 py-2.5 border border-ink-900 font-mono text-[11px] tracking-caps uppercase text-ink-900 hover:bg-ink-900 hover:text-cream transition-colors"
          >
            view &amp; download →
          </a>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-3">
          <p className="font-mono text-[11px] text-flare">{errorMsg}</p>
          <button
            onClick={() => setStatus('idle')}
            className="font-mono text-[11px] text-ink-500 underline"
          >
            try again
          </button>
        </div>
      )}
    </div>
  )
}
