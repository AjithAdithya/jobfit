'use client'
import { useState, useEffect, useRef } from 'react'
import { Loader2, RefreshCcw, AlertCircle, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { getMatchLevel } from '@/lib/matchLevel'

interface HardRequirement {
  requirement: string
  jdQuote: string
  category: 'experience' | 'skill' | 'education' | 'certification' | 'other'
}

interface Version {
  id: string
  version_number: number
  revision_note: string | null
  source: string
  created_at: string
  latex: string
  is_selected: boolean
}

interface Props {
  historyId: string
  score: number
  matches: string[]
  gaps: string[]
  selectedGaps: string[]
  keywords: string[]
  selectedKeywords: string[]
  hardRequirements: HardRequirement[]
  coverLetter: string | null
  coverLetterTone: string | null
  initialViewLatex: string | null
  initialViewVersionId: string | null
  initialVersions: Version[]
}

function isLatex(s: string) {
  return s.trimStart().startsWith('\\documentclass')
}

export default function HistoryDetailClient({
  historyId, score, matches, gaps, selectedGaps, keywords, selectedKeywords,
  hardRequirements, coverLetter, coverLetterTone,
  initialViewLatex, initialViewVersionId, initialVersions,
}: Props) {
  const level = getMatchLevel(score)

  const [versions, setVersions] = useState<Version[]>(initialVersions)
  const [viewingLatex, setViewingLatex] = useState<string | null>(initialViewLatex)
  const [viewingVersionId, setViewingVersionId] = useState<string | null>(initialViewVersionId)
  const [selecting, setSelecting] = useState<string | null>(null)
  const [coverOpen, setCoverOpen] = useState(false)

  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [compiling, setCompiling] = useState(false)
  const [compileError, setCompileError] = useState<string | null>(null)
  const prevPdfUrl = useRef<string | null>(null)
  const compileIdRef = useRef(0)

  useEffect(() => {
    if (!viewingLatex || !isLatex(viewingLatex)) return
    void compileLatex(viewingLatex)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewingLatex])

  const compileLatex = async (latex: string) => {
    const id = ++compileIdRef.current
    setCompiling(true)
    setCompileError(null)
    if (prevPdfUrl.current) { URL.revokeObjectURL(prevPdfUrl.current); prevPdfUrl.current = null }
    setPdfUrl(null)
    try {
      const res = await fetch('/api/resume/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latex }),
      })
      if (id !== compileIdRef.current) return
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error((j as any).error || `Error ${res.status}`)
      }
      const blob = await res.blob()
      if (id !== compileIdRef.current) return
      if (blob.size === 0) throw new Error('Empty PDF received')
      const url = URL.createObjectURL(blob)
      prevPdfUrl.current = url
      setPdfUrl(url)
    } catch (e: unknown) {
      if (id !== compileIdRef.current) return
      setCompileError(e instanceof Error ? e.message : String(e))
    } finally {
      if (id === compileIdRef.current) setCompiling(false)
    }
  }

  const handleView = (v: Version) => {
    setViewingVersionId(v.id)
    setViewingLatex(v.latex)
  }

  const handleSelect = async (v: Version) => {
    setSelecting(v.id)
    setVersions(prev => prev.map(vv => ({ ...vv, is_selected: vv.id === v.id })))
    setViewingVersionId(v.id)
    setViewingLatex(v.latex)
    try {
      await fetch('/api/resume/version', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ historyId, versionId: v.id }),
      })
    } finally {
      setSelecting(null)
    }
  }

  const selectedVersionId = versions.find(v => v.is_selected)?.id ?? null
  const isViewingSelected = viewingVersionId !== null && viewingVersionId === selectedVersionId
  const viewingVersion = versions.find(v => v.id === viewingVersionId) ?? null

  return (
    <div className="flex flex-col lg:flex-row gap-5 lg:gap-6 items-start">

      {/* ── Left panel ── */}
      <aside className="w-full lg:w-60 shrink-0 lg:sticky lg:top-24 lg:max-h-[calc(100vh-140px)] lg:overflow-y-auto space-y-4">

        {/* Score */}
        <div className="border border-ink-200 p-4">
          <p className="font-mono text-[9px] text-ink-400 tracking-caps uppercase mb-2">compatibility</p>
          <div className="flex items-baseline gap-1.5 mb-1">
            <span className="num font-chunk text-[3.25rem] leading-none tracking-tightest text-ink-900">{score}</span>
            <span className="num text-[12px] text-ink-400">/100</span>
          </div>
          <p className="font-serif italic text-[13px] text-crimson-500 mb-0.5">{level.label.toLowerCase()}</p>
          <p className="text-[11px] text-ink-400 mb-3">{level.subtitle}</p>
          <div className="flex gap-[2px]">
            {[0,1,2,3,4,5,6,7,8,9].map(i => {
              const lit = i < Math.ceil(score / 10)
              return (
                <div
                  key={i}
                  className={`h-1.5 flex-1 ${lit ? '' : 'bg-ink-100'}`}
                  style={lit ? { background: `linear-gradient(90deg, ${level.gradientFrom}, ${level.gradientTo})` } : {}}
                />
              )
            })}
          </div>
        </div>

        {/* Hard requirements */}
        {hardRequirements.length > 0 && (
          <div className="border border-flare/30 bg-flare/5 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <AlertCircle className="w-3.5 h-3.5 text-flare shrink-0" />
              <span className="font-mono text-[9px] text-flare tracking-caps uppercase">
                {hardRequirements.length} hard blocker{hardRequirements.length !== 1 ? 's' : ''}
              </span>
            </div>
            <ul className="space-y-1.5">
              {hardRequirements.map((r, i) => (
                <li key={i} className="text-[11px] text-ink-800 leading-snug">{r.requirement}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Keywords */}
        {keywords.length > 0 && (
          <div>
            <p className="font-mono text-[9px] text-ink-400 tracking-caps uppercase mb-2">
              keywords · <span className="num text-ink-700">{selectedKeywords.length}</span>/<span className="num">{keywords.length}</span>
            </p>
            <div className="flex flex-wrap gap-1">
              {keywords.map((k, i) => {
                const on = selectedKeywords.includes(k)
                return (
                  <span
                    key={i}
                    className={`px-2 py-0.5 text-[10px] border rounded-sm ${on ? 'bg-ink-900 text-cream border-ink-900' : 'border-ink-200 text-ink-400'}`}
                  >
                    {k}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {/* Strengths */}
        {matches.length > 0 && (
          <div>
            <p className="font-mono text-[9px] text-ink-400 tracking-caps uppercase mb-2">
              strengths · <span className="num text-ink-700">{matches.length}</span>
            </p>
            <ul className="space-y-1.5">
              {matches.map((m, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="font-mono text-[9px] text-ink-300 num shrink-0 mt-0.5">{String(i+1).padStart(2,'0')}</span>
                  <span className="text-[11px] text-ink-700 leading-snug">{m}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Gaps */}
        {gaps.length > 0 && (
          <div>
            <p className="font-mono text-[9px] text-ink-400 tracking-caps uppercase mb-2">
              gaps · <span className="num text-ink-700">{selectedGaps.length}</span> addressed
            </p>
            <ul className="space-y-1.5">
              {gaps.map((g, i) => {
                const on = selectedGaps.includes(g)
                return (
                  <li key={i} className="flex items-start gap-2">
                    <div className={`w-3.5 h-3.5 border flex items-center justify-center flex-shrink-0 mt-0.5 ${on ? 'bg-citrus border-citrus' : 'border-ink-300'}`}>
                      {on && <Check className="w-2.5 h-2.5 text-ink-900 stroke-[3]" />}
                    </div>
                    <span className={`text-[11px] leading-snug ${on ? 'text-ink-800' : 'text-ink-400'}`}>{g}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {/* Cover letter */}
        {coverLetter && (
          <div className="border border-ink-200">
            <button
              onClick={() => setCoverOpen(v => !v)}
              className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-ink-50 transition-colors"
            >
              <span className="font-mono text-[9px] text-ink-400 tracking-caps uppercase">
                cover letter{coverLetterTone ? ` · ${coverLetterTone.toLowerCase()}` : ''}
              </span>
              {coverOpen
                ? <ChevronUp className="w-3.5 h-3.5 text-ink-400" />
                : <ChevronDown className="w-3.5 h-3.5 text-ink-400" />
              }
            </button>
            {coverOpen && (
              <div className="px-3 pb-3 pt-1 text-[11px] text-ink-600 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto font-serif border-t border-ink-100">
                {coverLetter}
              </div>
            )}
          </div>
        )}
      </aside>

      {/* ── Centre panel ── */}
      <main className="flex-1 min-w-0 w-full">
        {viewingLatex ? (
          <div className="border border-ink-200">
            {/* Top bar */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-ink-200 bg-ink-50 gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-[9px] text-ink-500 tracking-caps uppercase truncate">
                  {viewingVersion
                    ? isViewingSelected
                      ? `v${viewingVersion.version_number}`
                      : `previewing v${viewingVersion.version_number}`
                    : 'original'
                  }
                </span>
                {isViewingSelected && (
                  <span className="font-mono text-[8px] text-citrus bg-citrus/20 px-1.5 py-0.5 tracking-caps uppercase shrink-0">active</span>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {!isViewingSelected && viewingVersion && (
                  <button
                    onClick={() => handleSelect(viewingVersion)}
                    disabled={!!selecting}
                    className="font-mono text-[9px] tracking-caps uppercase px-2 py-0.5 bg-ink-900 text-cream hover:bg-crimson-500 transition-colors disabled:opacity-50"
                  >
                    make active
                  </button>
                )}
                <button
                  onClick={() => viewingLatex && compileLatex(viewingLatex)}
                  disabled={compiling}
                  className="flex items-center gap-1 font-mono text-[9px] tracking-caps uppercase text-ink-400 hover:text-ink-900 disabled:opacity-40 transition-colors"
                >
                  <RefreshCcw className="w-2.5 h-2.5" /> recompile
                </button>
              </div>
            </div>

            {/* Content */}
            {compiling && (
              <div className="flex items-center justify-center gap-2 p-16 text-ink-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-[13px] font-mono">compiling…</span>
              </div>
            )}
            {compileError && !compiling && (
              <pre className="p-4 text-[11px] text-red-600 bg-red-50 whitespace-pre-wrap overflow-auto max-h-48">{compileError}</pre>
            )}
            {!isLatex(viewingLatex) && !compiling && (
              <div className="relative p-6 bg-white">
                <div
                  className="text-[13px] text-ink-600 max-h-64 overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: viewingLatex }}
                />
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent pointer-events-none" />
              </div>
            )}
            {pdfUrl && !compiling && (
              <iframe
                src={pdfUrl}
                title="Resume PDF"
                className="block w-full border-0 h-[70vh] lg:h-[calc(100vh-200px)]"
              />
            )}
          </div>
        ) : (
          <div className="border border-dashed border-ink-300 flex items-center justify-center p-16">
            <p className="text-[13px] text-ink-400 italic font-serif">no resume generated yet</p>
          </div>
        )}
      </main>

      {/* ── Right panel ── */}
      <aside className="w-full lg:w-56 shrink-0 lg:sticky lg:top-24 lg:max-h-[calc(100vh-140px)] lg:overflow-y-auto">
        <div className="border border-ink-200">
          <div className="px-3 py-2 border-b border-ink-200 bg-ink-50">
            <p className="font-mono text-[9px] text-ink-400 tracking-caps uppercase">versions</p>
          </div>

          {versions.length === 0 ? (
            <p className="text-[11px] text-ink-400 italic p-4">no versions saved yet</p>
          ) : (
            <ul className="divide-y divide-ink-100">
              {versions.map(v => {
                const isSelected = v.is_selected
                const isViewing = viewingVersionId === v.id
                return (
                  <li key={v.id} className={`px-3 py-3 transition-colors ${isViewing ? 'bg-ink-50' : ''}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="font-chunk text-[15px] text-ink-900 num leading-none">v{v.version_number}</span>
                      {isSelected && (
                        <span className="font-mono text-[8px] text-citrus bg-citrus/20 px-1.5 py-0.5 tracking-caps uppercase">active</span>
                      )}
                    </div>
                    <p className="font-mono text-[9px] text-ink-400 tracking-caps uppercase mb-1">
                      {new Date(v.created_at).toLocaleString(undefined, {
                        month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                    {v.revision_note && (
                      <p className="text-[10px] text-ink-500 italic font-serif mb-2 leading-snug line-clamp-2">"{v.revision_note}"</p>
                    )}
                    <div className="flex gap-1 mt-2">
                      <button
                        onClick={() => handleView(v)}
                        className={`flex-1 font-mono text-[9px] tracking-caps uppercase py-1 border transition-colors ${
                          isViewing
                            ? 'border-ink-900 bg-ink-900 text-cream'
                            : 'border-ink-300 text-ink-500 hover:border-ink-900 hover:text-ink-900'
                        }`}
                      >
                        {isViewing ? 'viewing' : 'view'}
                      </button>
                      {!isSelected && (
                        <button
                          onClick={() => handleSelect(v)}
                          disabled={!!selecting}
                          className="flex-1 font-mono text-[9px] tracking-caps uppercase py-1 border border-ink-300 text-ink-500 hover:border-citrus hover:text-ink-700 hover:bg-citrus/10 transition-colors disabled:opacity-40"
                        >
                          {selecting === v.id ? '…' : 'select'}
                        </button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </aside>

    </div>
  )
}
