'use client'
import { useState, useEffect, useRef } from 'react'
import { Loader2, RefreshCcw } from 'lucide-react'

function isLatex(s: string) {
  return s.trimStart().startsWith('\\documentclass')
}

export default function HistoryResumePreview({ source }: { source: string }) {
  const prevUrl = useRef<string | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [compiling, setCompiling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isLatex(source)) void compile()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const compile = async () => {
    setCompiling(true)
    setError(null)
    try {
      const res = await fetch('/api/resume/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latex: source }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error((j as any).error || `Error ${res.status}`)
      }
      const blob = await res.blob()
      if (blob.size === 0) throw new Error('Empty PDF received from compiler')
      const url = URL.createObjectURL(blob)
      if (prevUrl.current) URL.revokeObjectURL(prevUrl.current)
      prevUrl.current = url
      setPdfUrl(url)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setCompiling(false)
    }
  }

  if (!isLatex(source)) {
    return (
      <div className="relative p-6 bg-white border border-ink-200">
        <div
          className="text-[13px] text-ink-600 max-h-64 overflow-hidden"
          dangerouslySetInnerHTML={{ __html: source }}
        />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent pointer-events-none" />
      </div>
    )
  }

  return (
    <div className="border border-ink-200 bg-white">
      <div className="px-3 py-1.5 border-b border-ink-200 bg-ink-50 flex items-center justify-between">
        <span className="font-mono text-[9px] text-ink-400 tracking-caps uppercase">compiled preview</span>
        <button
          onClick={compile}
          disabled={compiling}
          className="flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono tracking-caps uppercase text-ink-500 hover:text-ink-900 hover:bg-ink-100 rounded transition-colors disabled:opacity-40"
        >
          <RefreshCcw className="w-2.5 h-2.5" /> recompile
        </button>
      </div>
      {compiling && (
        <div className="flex items-center justify-center gap-2 p-10 text-ink-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-[13px]">compiling…</span>
        </div>
      )}
      {error && !compiling && (
        <pre className="p-4 text-[11px] text-red-600 bg-red-50 whitespace-pre-wrap overflow-auto max-h-48">{error}</pre>
      )}
      {pdfUrl && !compiling && (
        <iframe
          src={pdfUrl}
          title="Resume PDF"
          className="block w-full border-0 h-[70vh] md:h-[900px] lg:h-[1100px]"
        />
      )}
    </div>
  )
}
