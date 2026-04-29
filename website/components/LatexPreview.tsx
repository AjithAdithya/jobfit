'use client'
import { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'

type Status = 'idle' | 'compiling' | 'done' | 'error'

function isLatex(s: string) {
  return s.trimStart().startsWith('\\documentclass')
}

interface Props {
  source: string
  className?: string
}

export default function LatexPreview({ source, className = '' }: Props) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const prevUrl = useRef<string | null>(null)

  // Deps intentionally empty — compile once per mount.
  // Parent controls recompilation by incrementing the `key` prop (key={recompileKey}).
  useEffect(() => {
    if (!source.trim() || !isLatex(source)) return
    let cancelled = false

    setStatus('compiling')
    setError(null)

    fetch('/api/resume/compile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latex: source }),
    })
      .then(res => {
        if (!res.ok) {
          return res.json().then(j => Promise.reject(new Error(j.error || `Error ${res.status}`)))
        }
        return res.blob()
      })
      .then(blob => {
        if (cancelled) return
        const url = URL.createObjectURL(blob)
        if (prevUrl.current) URL.revokeObjectURL(prevUrl.current)
        prevUrl.current = url
        setPdfUrl(url)
        setStatus('done')
      })
      .catch(e => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e))
          setStatus('error')
        }
      })

    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!source.trim()) return null

  if (!isLatex(source)) {
    return <div className={className} dangerouslySetInnerHTML={{ __html: source }} />
  }

  return (
    <div className={`relative ${className}`}>
      {status === 'compiling' && (
        <div className="flex items-center justify-center p-10 text-ink-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-[13px]">compiling…</span>
        </div>
      )}
      {status === 'error' && (
        <pre className="p-4 text-[11px] text-red-600 bg-red-50 whitespace-pre-wrap overflow-auto max-h-[300px]">
          {error}
        </pre>
      )}
      {pdfUrl && status === 'done' && (
        <object
          data={pdfUrl}
          type="application/pdf"
          style={{ border: 'none', width: '100%', height: '1100px', background: 'white' }}
        >
          <a href={pdfUrl} download="resume.pdf" className="block p-4 text-[13px] text-ink-600 underline">
            Download PDF
          </a>
        </object>
      )}
    </div>
  )
}
