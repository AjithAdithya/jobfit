'use client'
import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  ArrowLeft, Save, Loader2, FileText, Sparkles, RefreshCw,
  Download, Printer, Code, Eye,
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

export default function ResumeEditor(props: Props) {
  const [latex, setLatex] = useState(props.initialLatex)
  const [viewMode, setViewMode] = useState<'preview' | 'source'>('preview')
  const [edits, setEdits] = useState<EditEntry[]>([])

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
      if (viewMode === 'source') setViewMode('preview')
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
      {/* Print-only: show just the preview pane */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          .latex-print-target { display: block !important; }
        }
      `}</style>

      <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
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

        {/* 3-column grid */}
        <div className="grid grid-cols-12 gap-6">

          {/* Left rail — context */}
          <aside className="col-span-3">
            <div className="border border-ink-200 rounded-md bg-cream sticky top-24 p-4 space-y-5 text-[12px] max-h-[calc(100vh-160px)] overflow-y-auto">
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
          </aside>

          {/* Center — preview / source */}
          <main className="col-span-6">
            {/* Tab bar */}
            <div className="flex border border-ink-200 rounded-t-md overflow-hidden mb-0">
              <button
                onClick={() => setViewMode('preview')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-mono tracking-caps uppercase transition-colors ${viewMode === 'preview' ? 'bg-ink-900 text-cream' : 'text-ink-500 hover:text-ink-900'}`}
              >
                <Eye className="w-3 h-3" /> preview
              </button>
              <button
                onClick={() => setViewMode('source')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-mono tracking-caps uppercase transition-colors ${viewMode === 'source' ? 'bg-ink-900 text-cream' : 'text-ink-500 hover:text-ink-900'}`}
              >
                <Code className="w-3 h-3" /> source
              </button>
            </div>

            <div className="border border-t-0 border-ink-200 rounded-b-md bg-white relative overflow-hidden">
              {/* Generation overlay */}
              {generating && (
                <div className="absolute inset-0 bg-cream/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-10">
                  <Loader2 className="w-6 h-6 animate-spin text-ink-500" />
                  <p className="font-mono text-[11px] text-ink-500 tracking-caps uppercase">
                    {currentNode ? (NODE_LABELS[currentNode] ?? currentNode) : 'starting…'}
                  </p>
                </div>
              )}

              {viewMode === 'preview' && (
                <div className="latex-print-target p-2 min-h-[900px]">
                  <LatexPreview source={latex} />
                </div>
              )}

              {viewMode === 'source' && (
                <textarea
                  value={latex}
                  onChange={e => setLatex(e.target.value)}
                  spellCheck={false}
                  className="w-full font-mono text-[11px] text-ink-800 leading-relaxed p-4 min-h-[900px] resize-none focus:outline-none bg-ink-50"
                />
              )}
            </div>
          </main>

          {/* Right rail — AI modify + export */}
          <aside className="col-span-3 space-y-4">

            {/* AI modify */}
            <div className="border border-ink-200 rounded-md bg-cream">
              <div className="px-4 py-2.5 border-b border-ink-200">
                <p className="font-mono text-[10px] text-crimson-500 tracking-caps uppercase">modify with ai</p>
              </div>
              <div className="p-4 space-y-3">
                <textarea
                  value={instruction}
                  onChange={e => setInstruction(e.target.value)}
                  placeholder="Describe what to change — e.g. 'make the summary more concise', 'add more Python keywords', 'shorten to one page'…"
                  rows={4}
                  className="w-full text-[12px] p-2 border border-ink-300 rounded-sm focus:outline-none focus:border-ink-900 resize-none"
                />
                <button
                  onClick={handleModify}
                  disabled={!instruction.trim() || modifying}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-ink-900 text-cream text-[12px] font-medium rounded-md hover:bg-crimson-500 disabled:opacity-50"
                >
                  {modifying
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> applying…</>
                    : <><Sparkles className="w-3.5 h-3.5" /> apply changes</>
                  }
                </button>
                {modifyError && <p className="text-[11px] text-flare">{modifyError}</p>}
              </div>
            </div>

            {/* Edit history */}
            {edits.length > 0 && (
              <div className="border border-ink-200 rounded-md bg-cream">
                <div className="px-4 py-2.5 border-b border-ink-200">
                  <p className="font-mono text-[10px] text-ink-400 tracking-caps uppercase">
                    edits this session · <span className="num">{edits.length}</span>
                  </p>
                </div>
                <ul className="divide-y divide-ink-100 max-h-[240px] overflow-y-auto">
                  {edits.map(e => (
                    <li key={e.id} className="px-4 py-2.5">
                      <p className="font-serif italic text-[11px] text-crimson-500 leading-snug line-clamp-2">"{e.instruction}"</p>
                      <p className="text-[10px] text-ink-400 mt-0.5">{new Date(e.at).toLocaleTimeString()}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Export */}
            <div className="border border-ink-200 rounded-md bg-cream">
              <div className="px-4 py-2.5 border-b border-ink-200">
                <p className="font-mono text-[10px] text-ink-400 tracking-caps uppercase">export</p>
              </div>
              <div className="p-4 space-y-2">
                <button
                  onClick={handleDownloadTex}
                  className="w-full inline-flex items-center gap-2 px-3 py-2 border border-ink-300 text-ink-700 text-[12px] rounded-sm hover:border-ink-900 hover:text-ink-900 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> download .tex
                </button>
                <button
                  onClick={handlePrint}
                  className="w-full inline-flex items-center gap-2 px-3 py-2 border border-ink-300 text-ink-700 text-[12px] rounded-sm hover:border-ink-900 hover:text-ink-900 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" /> print / save as PDF
                </button>
              </div>
            </div>

          </aside>
        </div>
      </div>
    </>
  )
}
