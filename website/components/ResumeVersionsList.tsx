'use client'
import { useEffect, useState } from 'react'
import { Loader2, Download, Eye, X, RefreshCcw, Clock } from 'lucide-react'

interface Version {
  id: string
  version_number: number
  revision_note: string | null
  source: string
  created_at: string
  latex: string
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString(undefined, { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function ResumeVersionsList({ historyId }: { historyId: string }) {
  const [versions, setVersions] = useState<Version[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Inline preview/compile state for one version at a time
  const [openId, setOpenId] = useState<string | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [compiling, setCompiling] = useState(false)
  const [compileError, setCompileError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/resume/version?historyId=${historyId}`)
      .then(r => r.json())
      .then(j => {
        if (j.error) throw new Error(j.error)
        setVersions(j.versions || [])
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [historyId])

  const downloadTex = (v: Version) => {
    const blob = new Blob([v.latex], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `resume_v${v.version_number}.tex`
    a.click()
    URL.revokeObjectURL(url)
  }

  const compileVersion = async (v: Version) => {
    setOpenId(v.id)
    setCompiling(true)
    setCompileError(null)
    if (pdfUrl) URL.revokeObjectURL(pdfUrl)
    setPdfUrl(null)
    try {
      const res = await fetch('/api/resume/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latex: v.latex }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || `Error ${res.status}`)
      }
      const blob = await res.blob()
      if (blob.size === 0) throw new Error('Empty PDF received')
      setPdfUrl(URL.createObjectURL(blob))
    } catch (e: any) {
      setCompileError(e.message || String(e))
    } finally {
      setCompiling(false)
    }
  }

  const closePreview = () => {
    setOpenId(null)
    if (pdfUrl) URL.revokeObjectURL(pdfUrl)
    setPdfUrl(null)
    setCompileError(null)
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-ink-400 text-[13px]">
        <Loader2 className="w-4 h-4 animate-spin" /> loading versions…
      </div>
    )
  }

  if (error) {
    return <p className="text-[12px] text-flare">{error}</p>
  }

  if (!versions || versions.length === 0) {
    return <p className="text-[12px] text-ink-400 italic">no versions yet — every generated resume will appear here</p>
  }

  return (
    <div className="space-y-3">
      <ul className="divide-y divide-ink-200 border border-ink-200 bg-white">
        {versions.map(v => {
          const isOpen = openId === v.id
          return (
            <li key={v.id} className="px-4 py-3">
              <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <span className="font-chunk text-[18px] text-ink-900 num leading-none">v{v.version_number}</span>
                    <span className="font-mono text-[10px] text-ink-400 tracking-caps uppercase flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" /> {formatTime(v.created_at)}
                    </span>
                    <span className="font-mono text-[9px] text-ink-300 tracking-caps uppercase">{v.source}</span>
                  </div>
                  {v.revision_note && (
                    <p className="text-[12px] text-ink-600 italic font-serif mt-1.5 leading-snug">"{v.revision_note}"</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                  <button
                    onClick={() => isOpen ? closePreview() : compileVersion(v)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 border border-ink-200 hover:border-ink-900 text-[10px] font-mono uppercase tracking-caps text-ink-600 hover:text-ink-900 transition-colors"
                  >
                    {isOpen ? <><X className="w-3 h-3" /> close</> : <><Eye className="w-3 h-3" /> view</>}
                  </button>
                  <button
                    onClick={() => downloadTex(v)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 border border-ink-200 hover:border-ink-900 text-[10px] font-mono uppercase tracking-caps text-ink-600 hover:text-ink-900 transition-colors"
                  >
                    <Download className="w-3 h-3" /> .tex
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="mt-3 border border-ink-200 bg-ink-50">
                  <div className="px-3 py-1.5 border-b border-ink-200 flex items-center justify-between">
                    <span className="font-mono text-[9px] text-ink-400 tracking-caps uppercase">compiled preview</span>
                    <button
                      onClick={() => compileVersion(v)}
                      disabled={compiling}
                      className="flex items-center gap-1 text-[9px] font-mono tracking-caps uppercase text-ink-500 hover:text-ink-900 disabled:opacity-40"
                    >
                      <RefreshCcw className="w-2.5 h-2.5" /> recompile
                    </button>
                  </div>
                  {compiling && (
                    <div className="flex items-center justify-center gap-2 p-8 text-ink-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-[12px]">compiling…</span>
                    </div>
                  )}
                  {compileError && !compiling && (
                    <pre className="p-3 text-[11px] text-red-600 bg-red-50 whitespace-pre-wrap overflow-auto max-h-48">{compileError}</pre>
                  )}
                  {pdfUrl && !compiling && (
                    <iframe src={pdfUrl} title={`v${v.version_number} PDF`} className="block w-full border-0 h-[60vh] md:h-[700px] lg:h-[900px]" />
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
