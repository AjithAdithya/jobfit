'use client'
import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  ArrowLeft, Save, Loader2, FileText, Sparkles, RefreshCw,
  Download, Printer, RefreshCcw, ChevronLeft, ChevronRight, Minimize2,
} from 'lucide-react'

const LatexPreview = dynamic(() => import('./LatexPreview'), { ssr: false })

interface Props {
  historyId: string
  initialLatex: string
  jobTitle: string
  jobUrl: string
  siteName: string
  score: number
  keywords: string[]
  selectedKeywords: string[]
  gaps: string[]
  selectedGaps: string[]
  matches: string[]
  baseResumeName: string | null
  baseResumeText: string | null
}

interface EditEntry {
  id: string
  instruction: string
  at: number
}

const NODE_LABELS: Record<string, string> = {
  retrieve_context: 'retrieving context',
  write_resume: 'writing resume',
  critique: 'critiquing quality',
  guardian: 'checking safety',
  polish: 'polishing output',
}

const GLASS_STYLE = {
  background: 'rgba(237, 233, 227, 0.88)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
} as const

export default function ResumeEditor(props: Props) {
  const [latex, setLatex] = useState(props.initialLatex)
  const [recompileKey, setRecompileKey] = useState(0)
  const [edits, setEdits] = useState<EditEntry[]>([])

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [floatOpen, setFloatOpen] = useState(true)

  // AI modification
  const [instruction, setInstruction] = useState('')
  const [modifying, setModifying] = useState(false)
  const [modifyError, setModifyError] = useState<string | null>(null)

  // Save
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  // LangGraph regeneration
  const [generating, setGenerating] = useState(false)
  const [currentNode, setCurrentNode] = useState<string | null>(null)
  const [genError, setGenError] = useState<string | null>(null)

  const handleModify = async () => {
    if (!instruction.trim()) return
    setModifying(true)
    setModifyError(null)
    try {
      const res = await fetch('/api/resume/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latex,
          instruction: instruction.trim(),
          context: {
            jobTitle: props.jobTitle,
            keywords: props.selectedKeywords.length ? props.selectedKeywords : props.keywords,
            gaps: props.selectedGaps.length ? props.selectedGaps : props.gaps,
          },
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error((json as any).error || `Server error ${res.status}`)
      const modified: string = (json as any).latex
      if (!modified) throw new Error('Empty response from server')
      setEdits(prev => [{ id: crypto.randomUUID(), instruction: instruction.trim(), at: Date.now() }, ...prev])
      setLatex(modified)
      setInstruction('')
      setRecompileKey(k => k + 1)
    } catch (err: unknown) {
      setModifyError(err instanceof Error ? err.message : 'Modification failed')
    } finally {
      setModifying(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch('/api/resume/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: props.historyId, html: latex }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error((json as any).error || `Server error ${res.status}`)
      setSavedAt(Date.now())
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleRegenerate = async () => {
    setGenerating(true)
    setCurrentNode(null)
    setGenError(null)
    try {
      const res = await fetch('/api/resume/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: props.jobTitle,
          companyName: props.siteName || undefined,
          selectedGaps: props.selectedGaps.length ? props.selectedGaps : props.gaps,
          selectedKeywords: props.selectedKeywords.length ? props.selectedKeywords : props.keywords,
          resumeContext: props.baseResumeText || '',
        }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error((json as any).error || `Server error ${res.status}`)
      }
      const reader = res.body!.getReader()
      const dec = new TextDecoder()
      let buf = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += dec.decode(value, { stream: true })
        const chunks = buf.split('\n\n')
        buf = chunks.pop() ?? ''
        for (const chunk of chunks) {
          let eventType = 'message'
          let data = ''
          for (const line of chunk.split('\n')) {
            if (line.startsWith('event: ')) eventType = line.slice(7).trim()
            if (line.startsWith('data: ')) data = line.slice(6).trim()
          }
          if (!data) continue
          const parsed = JSON.parse(data)
          if (eventType === 'node') setCurrentNode(parsed.node)
          else if (eventType === 'done') {
            const incoming = (parsed.html || '').replace(/```latex\s*/gi, '').replace(/```\s*/g, '').trim()
            setLatex(incoming || parsed.html || '')
            setCurrentNode(null)
          } else if (eventType === 'error') throw new Error(parsed.error || 'Generation failed')
        }
      }
    } catch (err: unknown) {
      setGenError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setGenerating(false)
      setCurrentNode(null)
    }
  }

  const handleDownloadTex = useCallback(() => {
    const blob = new Blob([latex], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${props.jobTitle.replace(/[^a-z0-9]/gi, '_')}_resume.tex`
    a.click()
    URL.revokeObjectURL(url)
  }, [latex, props.jobTitle])

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  return (
    <>
      <style>{`
        @media print {
          body > * { display: none !important; }
          .latex-print-target { display: block !important; }
        }
      `}</style>

      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 pb-44">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 gap-6">
          <div>
            <Link
              href={`/dashboard/history/${props.historyId}`}
              className="inline-flex items-center gap-2 text-[13px] text-ink-500 hover:text-ink-900 mb-3"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> back to analysis
            </Link>
            <p className="font-mono text-[10px] text-crimson-500 tracking-caps uppercase mb-2">resume editor</p>
            <h1 className="font-chunk text-[36px] leading-tight tracking-tight text-ink-900">
              {props.jobTitle}
            </h1>
            <p className="text-[13px] text-ink-500 mt-1">{props.siteName}</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            {genError && <span className="text-[11px] text-flare max-w-[200px] truncate">{genError}</span>}
            {savedAt && !saving && (
              <span className="text-[11px] text-ink-500 font-mono tracking-caps uppercase">
                saved · {new Date(savedAt).toLocaleTimeString()}
              </span>
            )}
            {saveError && <span className="text-[11px] text-flare">{saveError}</span>}
            <button
              onClick={handleRegenerate}
              disabled={generating || saving}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-ink-300 text-ink-700 text-[13px] rounded-md hover:border-ink-900 hover:text-ink-900 disabled:opacity-50 transition-colors"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              regenerate
            </button>
            <button
              onClick={handleSave}
              disabled={saving || generating}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-ink-900 text-cream font-medium text-[13px] rounded-md hover:bg-crimson-500 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              save
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-12 gap-6">

          {/* Left rail — collapsible match context */}
          {!sidebarCollapsed && (
            <aside className="col-span-3">
              <div className="border border-ink-200 rounded-md bg-cream sticky top-24 text-[12px] max-h-[calc(100vh-160px)] overflow-y-auto">
                <div className="px-4 py-3 flex items-center justify-between border-b border-ink-100">
                  <p className="font-mono text-[9px] text-ink-400 tracking-caps uppercase">match context</p>
                  <button
                    onClick={() => setSidebarCollapsed(true)}
                    className="text-ink-400 hover:text-ink-900 transition-colors"
                    title="Collapse"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-4 space-y-5">
                  {/* Score */}
                  <div>
                    <p className="font-mono text-[9px] text-ink-400 tracking-caps uppercase mb-1">match score</p>
                    <div className="flex items-baseline gap-1">
                      <span className="font-chunk text-[32px] leading-none tracking-tight text-ink-900 num">{props.score}</span>
                      <span className="num text-[11px] text-ink-400">/100</span>
                    </div>
                  </div>

                  {/* Base resume */}
                  <div>
                    <p className="font-mono text-[9px] text-ink-400 tracking-caps uppercase mb-2">base resume</p>
                    {props.baseResumeName ? (
                      <div className="flex items-start gap-2 p-2 border border-ink-200 rounded-sm">
                        <FileText className="w-3.5 h-3.5 mt-0.5 text-ink-500 shrink-0" />
                        <span className="text-[12px] text-ink-700 break-all">{props.baseResumeName}</span>
                      </div>
                    ) : (
                      <p className="text-[11px] text-ink-400 italic">unknown source</p>
                    )}
                  </div>

                  {/* Keywords */}
                  {props.keywords.length > 0 && (
                    <div>
                      <p className="font-mono text-[9px] text-ink-400 tracking-caps uppercase mb-2">target keywords</p>
                      <div className="flex flex-wrap gap-1">
                        {props.keywords.map((k, i) => {
                          const on = props.selectedKeywords.includes(k)
                          return (
                            <span key={i} className={`px-2 py-0.5 text-[10px] rounded-sm border ${on ? 'bg-ink-900 text-cream border-ink-900' : 'border-ink-300 text-ink-500'}`}>
                              {k}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Gaps */}
                  {props.gaps.length > 0 && (
                    <div>
                      <p className="font-mono text-[9px] text-ink-400 tracking-caps uppercase mb-2">gaps addressed</p>
                      <ul className="space-y-1.5">
                        {props.gaps.map((g, i) => {
                          const on = props.selectedGaps.includes(g)
                          return (
                            <li key={i} className="flex items-start gap-2">
                              <span className={`w-1.5 h-1.5 mt-1.5 rounded-full shrink-0 ${on ? 'bg-citrus' : 'bg-ink-200'}`} />
                              <span className={`text-[11px] leading-snug ${on ? 'text-ink-900' : 'text-ink-400'}`}>{g}</span>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )}

                  {/* Matches */}
                  {props.matches.length > 0 && (
                    <div>
                      <p className="font-mono text-[9px] text-ink-400 tracking-caps uppercase mb-2">strengths leveraged</p>
                      <ul className="space-y-1">
                        {props.matches.map((m, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="font-mono text-[9px] text-ink-400 num">{String(i + 1).padStart(2, '0')}</span>
                            <span className="text-[11px] text-ink-700 leading-snug">{m}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </aside>
          )}

          {/* Center — editor */}
          <main className={sidebarCollapsed ? 'col-span-12' : 'col-span-9'}>
            {sidebarCollapsed && (
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="mb-3 flex items-center gap-1.5 text-[11px] font-mono text-ink-500 hover:text-ink-900 tracking-caps uppercase transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
                match context
              </button>
            )}

            <div className="flex border border-ink-200 rounded-md overflow-hidden relative" style={{ minHeight: '940px' }}>
              {/* Generation overlay */}
              {generating && (
                <div className="absolute inset-0 bg-cream/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-10">
                  <Loader2 className="w-6 h-6 animate-spin text-ink-500" />
                  <p className="font-mono text-[11px] text-ink-500 tracking-caps uppercase">
                    {currentNode ? (NODE_LABELS[currentNode] ?? currentNode) : 'starting…'}
                  </p>
                </div>
              )}

              {/* Source pane */}
              <div className="flex flex-col w-1/2 border-r border-ink-200">
                <div className="px-3 py-1.5 border-b border-ink-200 bg-ink-50 flex items-center justify-between">
                  <span className="font-mono text-[9px] text-ink-400 tracking-caps uppercase">source</span>
                  <button
                    onClick={handleDownloadTex}
                    className="flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono tracking-caps uppercase text-ink-500 hover:text-ink-900 hover:bg-ink-100 rounded transition-colors"
                    title="Download .tex"
                  >
                    <Download className="w-2.5 h-2.5" /> .tex
                  </button>
                </div>
                <textarea
                  value={latex}
                  onChange={e => setLatex(e.target.value)}
                  spellCheck={false}
                  className="flex-1 w-full font-mono text-[11px] text-ink-800 leading-relaxed p-3 resize-none focus:outline-none bg-white"
                  style={{ minHeight: '900px' }}
                />
              </div>

              {/* Preview pane */}
              <div className="flex flex-col w-1/2">
                <div className="px-3 py-1.5 border-b border-ink-200 bg-ink-50 flex items-center justify-between">
                  <span className="font-mono text-[9px] text-ink-400 tracking-caps uppercase">preview</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrint}
                      className="flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono tracking-caps uppercase text-ink-500 hover:text-ink-900 hover:bg-ink-100 rounded transition-colors"
                      title="Save as PDF"
                    >
                      <Printer className="w-2.5 h-2.5" /> pdf
                    </button>
                    <button
                      onClick={() => setRecompileKey(k => k + 1)}
                      className="flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono tracking-caps uppercase text-ink-500 hover:text-ink-900 hover:bg-ink-100 rounded transition-colors"
                    >
                      <RefreshCcw className="w-2.5 h-2.5" /> recompile
                    </button>
                  </div>
                </div>
                <div className="latex-print-target flex-1 overflow-auto bg-white">
                  <LatexPreview key={recompileKey} source={latex} />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Floating AI edit panel */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-md px-4 pointer-events-none">
        <div className="pointer-events-auto">
          {floatOpen ? (
            <div
              className="rounded-2xl border border-ink-200/60 shadow-2xl overflow-hidden"
              style={GLASS_STYLE}
            >
              {/* Panel header */}
              <div className="px-4 py-2.5 flex items-center justify-between border-b border-ink-200/50">
                <p className="font-mono text-[10px] text-crimson-500 tracking-caps uppercase flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" /> modify with ai
                </p>
                <div className="flex items-center gap-2">
                  {edits.length > 0 && (
                    <span className="font-mono text-[9px] text-ink-400 tracking-caps uppercase num">
                      {edits.length} edit{edits.length !== 1 ? 's' : ''}
                    </span>
                  )}
                  <button
                    onClick={() => setFloatOpen(false)}
                    className="text-ink-400 hover:text-ink-900 transition-colors"
                    title="Minimize"
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Edit history — above the input, scrollable */}
              {edits.length > 0 && (
                <div className="border-b border-ink-200/50 max-h-[120px] overflow-y-auto">
                  <ul className="divide-y divide-ink-100/50">
                    {edits.map(e => (
                      <li key={e.id} className="px-4 py-2 flex items-start gap-3">
                        <span className="font-mono text-[9px] text-ink-400 mt-0.5 shrink-0 num">
                          {new Date(e.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <p className="font-serif italic text-[11px] text-ink-700 leading-snug line-clamp-1">"{e.instruction}"</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* AI modify input */}
              <div className="p-4 space-y-3">
                <textarea
                  value={instruction}
                  onChange={e => setInstruction(e.target.value)}
                  onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleModify() }}
                  placeholder="Describe a change — e.g. 'make the summary more concise', 'add Python keywords', 'shorten to one page'…"
                  rows={3}
                  className="w-full text-[12px] p-3 border border-ink-300/70 rounded-lg focus:outline-none focus:border-ink-900 resize-none bg-white/60 backdrop-blur-sm placeholder:text-ink-400"
                />
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] text-ink-400 font-mono">⌘↵ to apply</span>
                  <button
                    onClick={handleModify}
                    disabled={!instruction.trim() || modifying}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-ink-900 text-cream text-[12px] font-medium rounded-lg hover:bg-crimson-500 disabled:opacity-50 transition-colors"
                  >
                    {modifying
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> applying…</>
                      : <><Sparkles className="w-3.5 h-3.5" /> apply</>
                    }
                  </button>
                </div>
                {modifyError && <p className="text-[11px] text-flare">{modifyError}</p>}
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={() => setFloatOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full shadow-xl border border-ink-200/60 text-[11px] font-mono tracking-caps uppercase text-ink-700 hover:text-ink-900 transition-all hover:scale-105 active:scale-95"
                style={GLASS_STYLE}
              >
                <Sparkles className="w-3 h-3 text-crimson-500" />
                ai edit
                {edits.length > 0 && (
                  <span className="px-1.5 py-0.5 bg-crimson-500 text-cream text-[9px] rounded-full num leading-none">
                    {edits.length}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
