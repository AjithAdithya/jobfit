'use client'
import { useState, useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Save, Loader2, FileText, Sparkles, RefreshCw,
  Download, RefreshCcw, ChevronLeft, ChevronRight, Minimize2,
  Palette, Check, Trash2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DEFAULT_RESUME_STYLE } from '@/lib/types'
import type { ResumeStyle } from '@/lib/types'
import { DEFAULT_TEMPLATES } from '@/lib/defaultTemplates'

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

interface StylePreset {
  id: string
  name: string
  instruction: string
  style_json: ResumeStyle
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
  backdropFilter: 'blur(6px)',
  WebkitBackdropFilter: 'blur(6px)',
} as const

const LATEX_FONTS = [
  { value: 'Latin Modern', label: 'Latin Modern (default)' },
  { value: 'TeX Gyre Termes', label: 'TeX Gyre Termes (Times)' },
  { value: 'TeX Gyre Heros', label: 'TeX Gyre Heros (Helvetica)' },
  { value: 'TeX Gyre Pagella', label: 'TeX Gyre Pagella (Palatino)' },
  { value: 'TeX Gyre Bonum', label: 'TeX Gyre Bonum (Bookman)' },
  { value: 'EB Garamond', label: 'EB Garamond' },
  { value: 'Lato', label: 'Lato (modern sans)' },
  { value: 'Source Sans Pro', label: 'Source Sans Pro' },
]

const COLOR_SWATCHES = [
  '#000000', '#1B2A4A', '#1A3A2A', '#6B2737', '#2D3748', '#7C3AED',
]

export default function ResumeEditor(props: Props) {
  const [latex, setLatex] = useState(props.initialLatex)
  const [edits, setEdits] = useState<EditEntry[]>([])

  // PDF preview
  const prevPdfUrl = useRef<string | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [compiling, setCompiling] = useState(false)
  const [compileError, setCompileError] = useState<string | null>(null)

  const [contextCollapsed, setContextCollapsed] = useState(true)
  const [sourceCollapsed, setSourceCollapsed] = useState(true)
  const [styleCollapsed, setStyleCollapsed] = useState(true)
  const [floatOpen, setFloatOpen] = useState(true)

  // Style panel
  const [style, setStyle] = useState<ResumeStyle>(DEFAULT_RESUME_STYLE)
  const [presets, setPresets] = useState<StylePreset[]>([])
  const [presetsLoaded, setPresetsLoaded] = useState(false)
  const [restyling, setRestyling] = useState(false)
  const [restyleError, setRestyleError] = useState<string | null>(null)
  const [savingPreset, setSavingPreset] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [showSavePreset, setShowSavePreset] = useState(false)
  const [appliedPresetId, setAppliedPresetId] = useState<string | null>(null)

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

  const busy = generating || modifying || restyling || compiling

  const compile = useCallback(async (source: string) => {
    setCompiling(true)
    setCompileError(null)
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
      console.log('[compile] received blob:', blob.size, 'bytes, type:', blob.type)
      if (blob.size === 0) throw new Error('Empty PDF received from compiler')
      const url = URL.createObjectURL(blob)
      if (prevPdfUrl.current) URL.revokeObjectURL(prevPdfUrl.current)
      prevPdfUrl.current = url
      setPdfUrl(url)
    } catch (e: unknown) {
      setCompileError(e instanceof Error ? e.message : String(e))
    } finally {
      setCompiling(false)
    }
  }, [])

  // Auto-compile on first load
  useEffect(() => {
    if (props.initialLatex.trim()) void compile(props.initialLatex)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load presets lazily when style rail first opened
  useEffect(() => {
    if (styleCollapsed || presetsLoaded) return
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('style_presets')
        .select('id, name, instruction, style_json')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          if (data) setPresets(data as StylePreset[])
          setPresetsLoaded(true)
        })
    })
  }, [styleCollapsed, presetsLoaded])

  // Persist a generated/edited resume as a new version row
  const recordVersion = useCallback(async (latexSource: string, revisionNote: string | null) => {
    try {
      await fetch('/api/resume/version', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          historyId: props.historyId,
          latex: latexSource,
          revisionNote,
          source: 'website',
        }),
      })
    } catch (err) {
      console.warn('Version write failed (non-blocking):', err)
    }
  }, [props.historyId])

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
      const editNote = instruction.trim()
      setEdits(prev => [{ id: crypto.randomUUID(), instruction: editNote, at: Date.now() }, ...prev])
      setLatex(modified)
      setInstruction('')
      void compile(modified)
      void recordVersion(modified, `AI edit: ${editNote}`)
    } catch (err: unknown) {
      setModifyError(err instanceof Error ? err.message : 'Modification failed')
    } finally {
      setModifying(false)
    }
  }

  const handleRestyle = async () => {
    setRestyling(true)
    setRestyleError(null)
    setShowSavePreset(false)
    try {
      const res = await fetch('/api/resume/restyle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latex, style }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error((json as any).error || `Server error ${res.status}`)
      const restyled: string = (json as any).latex
      if (!restyled) throw new Error('Empty response from server')
      setLatex(restyled)
      void compile(restyled)
      void recordVersion(restyled, 'Re-style applied')
      setShowSavePreset(true)
      setAppliedPresetId(null)
    } catch (err: unknown) {
      setRestyleError(err instanceof Error ? err.message : 'Restyle failed')
    } finally {
      setRestyling(false)
    }
  }

  const handleSavePreset = async () => {
    if (!presetName.trim()) return
    setSavingPreset(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data } = await supabase
        .from('style_presets')
        .insert({ user_id: user.id, name: presetName.trim(), instruction: '', style_json: style })
        .select('id, name, instruction, style_json')
        .single()
      if (data) {
        setPresets(prev => [data as StylePreset, ...prev])
        setAppliedPresetId(data.id)
      }
      setPresetName('')
      setShowSavePreset(false)
    } catch (err: unknown) {
      setRestyleError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSavingPreset(false)
    }
  }

  const handleLoadPreset = (preset: StylePreset) => {
    setStyle(preset.style_json)
    setAppliedPresetId(preset.id)
    setShowSavePreset(false)
  }

  const handleDeletePreset = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const supabase = createClient()
    await supabase.from('style_presets').delete().eq('id', id)
    setPresets(prev => prev.filter(p => p.id !== id))
    if (appliedPresetId === id) setAppliedPresetId(null)
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
            const newLatex = incoming || parsed.html || ''
            setLatex(newLatex)
            setCurrentNode(null)
            void compile(newLatex)
            void recordVersion(newLatex, 'Regenerated from analysis')
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

  const setStyleField = <K extends keyof ResumeStyle>(key: K, value: ResumeStyle[K]) =>
    setStyle(s => ({ ...s, [key]: value }))

  const setStyleNested = <K extends keyof ResumeStyle>(
    key: K,
    sub: keyof ResumeStyle[K],
    value: unknown,
  ) => setStyle(s => ({ ...s, [key]: { ...(s[key] as object), [sub]: value } }))

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
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6 lg:mb-8 gap-4 lg:gap-6">
          <div className="min-w-0">
            <Link
              href={`/dashboard/history/${props.historyId}`}
              className="inline-flex items-center gap-2 text-[13px] text-ink-500 hover:text-ink-900 mb-3"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> back to analysis
            </Link>
            <p className="font-mono text-[10px] text-crimson-500 tracking-caps uppercase mb-2">resume editor</p>
            <h1 className="font-chunk text-[clamp(1.75rem,6vw,2.25rem)] leading-tight tracking-tight text-ink-900 break-words">{props.jobTitle}</h1>
            <p className="text-[13px] text-ink-500 mt-1 truncate">{props.siteName}</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap lg:justify-end">
            {genError && <span className="text-[11px] text-flare max-w-[200px] truncate">{genError}</span>}
            {savedAt && !saving && (
              <span className="text-[11px] text-ink-500 font-mono tracking-caps uppercase">
                saved · {new Date(savedAt).toLocaleTimeString()}
              </span>
            )}
            {saveError && <span className="text-[11px] text-flare">{saveError}</span>}
            <button
              onClick={handleRegenerate}
              disabled={busy || saving}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-2.5 border border-ink-300 text-ink-700 text-[12px] sm:text-[13px] rounded-md hover:border-ink-900 hover:text-ink-900 disabled:opacity-50 transition-colors"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              regenerate
            </button>
            <button
              onClick={handleSave}
              disabled={saving || busy}
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-ink-900 text-cream font-medium text-[12px] sm:text-[13px] rounded-md hover:bg-crimson-500 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              save
            </button>
          </div>
        </div>

        {/* Three-panel layout: context | source+pdf | style. Stacks vertically below lg. */}
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-5 lg:items-start">

          {/* Left rail — match context */}
          {!contextCollapsed && (
            <aside className="w-full lg:w-64 lg:shrink-0 lg:sticky lg:top-24">
              <div className="border border-ink-200 rounded-md bg-cream text-[12px] lg:max-h-[calc(100vh-160px)] lg:overflow-y-auto">
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-ink-200 bg-ink-900">
                  <span className="font-mono text-[9px] text-cream/70 tracking-caps uppercase flex items-center gap-1.5">
                    <FileText className="w-3 h-3" /> context
                  </span>
                  <button onClick={() => setContextCollapsed(true)} className="text-cream/50 hover:text-cream transition-colors">
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="p-4 space-y-5">
                  <div>
                    <p className="font-mono text-[9px] text-ink-400 tracking-caps uppercase mb-1">match score</p>
                    <div className="flex items-baseline gap-1">
                      <span className="font-chunk text-[32px] leading-none tracking-tight text-ink-900 num">{props.score}</span>
                      <span className="num text-[11px] text-ink-400">/100</span>
                    </div>
                  </div>
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

          {/* Center — source + preview */}
          <main className="flex-1 min-w-0 w-full">
            {/* Collapsed panel toggles */}
            {(contextCollapsed || styleCollapsed) && (
              <div className="flex items-center justify-between mb-4">
                <div>
                  {contextCollapsed && (
                    <button
                      onClick={() => setContextCollapsed(false)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 border border-ink-300 text-ink-700 text-[13px] rounded-md hover:border-ink-900 hover:text-ink-900 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" /> context
                    </button>
                  )}
                </div>
                {styleCollapsed && (
                  <button
                    onClick={() => setStyleCollapsed(false)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-ink-900 text-cream font-medium text-[13px] rounded-md hover:bg-crimson-500 transition-colors"
                  >
                    <Palette className="w-4 h-4" /> style
                  </button>
                )}
              </div>
            )}

            <div className="flex flex-col md:flex-row border border-ink-200 rounded-md overflow-hidden relative min-h-[70vh] md:min-h-[940px]">
              {/* Overlay */}
              {busy && (
                <div className="absolute inset-0 bg-cream/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-10">
                  <Loader2 className="w-6 h-6 animate-spin text-ink-500" />
                  <p className="font-mono text-[11px] text-ink-500 tracking-caps uppercase">
                    {generating
                      ? (currentNode ? NODE_LABELS[currentNode] ?? currentNode : 'starting…')
                      : modifying ? 'applying changes…'
                      : 're-styling…'}
                  </p>
                </div>
              )}

              {/* Source — thin crimson tab when collapsed (horizontal on mobile, vertical on md+), full pane when open */}
              {sourceCollapsed ? (
                <button
                  onClick={() => setSourceCollapsed(false)}
                  title="Show source"
                  className="h-8 md:h-auto md:w-8 shrink-0 bg-crimson-500 hover:bg-crimson-600 transition-colors flex items-center justify-center border-b md:border-b-0 md:border-r border-crimson-600"
                >
                  <span className="md:hidden font-mono text-[9px] text-white tracking-widest uppercase select-none">
                    source
                  </span>
                  <span
                    className="hidden md:inline font-mono text-[9px] text-white tracking-widest uppercase select-none"
                    style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                  >
                    source
                  </span>
                </button>
              ) : (
                <div className="flex flex-col w-full md:w-1/2 border-b md:border-b-0 md:border-r border-ink-200">
                  <div className="px-3 py-1.5 border-b border-ink-200 bg-ink-50 flex items-center justify-between">
                    <span className="font-mono text-[9px] text-ink-400 tracking-caps uppercase">source</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleDownloadTex}
                        className="flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono tracking-caps uppercase text-ink-500 hover:text-ink-900 hover:bg-ink-100 rounded transition-colors"
                      >
                        <Download className="w-2.5 h-2.5" /> .tex
                      </button>
                      <button
                        onClick={() => setSourceCollapsed(true)}
                        className="p-1 text-ink-400 hover:text-ink-900 hover:bg-ink-100 rounded transition-colors"
                        title="Hide source"
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={latex}
                    onChange={e => setLatex(e.target.value)}
                    disabled={busy}
                    spellCheck={false}
                    className="flex-1 w-full font-mono text-[11px] text-ink-800 leading-relaxed p-3 resize-none focus:outline-none bg-white disabled:opacity-60 disabled:cursor-not-allowed min-h-[50vh] md:min-h-[900px]"
                  />
                </div>
              )}

              {/* Preview pane — full width when source is collapsed */}
              <div className="flex flex-col flex-1 min-w-0">
                <div className="px-3 py-1.5 border-b border-ink-200 bg-ink-50 flex items-center justify-between">
                  <span className="font-mono text-[9px] text-ink-400 tracking-caps uppercase">preview</span>
                  <button
                    onClick={() => compile(latex)}
                    disabled={busy}
                    className="flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono tracking-caps uppercase text-ink-500 hover:text-ink-900 hover:bg-ink-100 rounded transition-colors disabled:opacity-40"
                  >
                    <RefreshCcw className="w-2.5 h-2.5" /> recompile
                  </button>
                </div>
                <div className="latex-print-target flex-1 bg-white">
                  {compiling && (
                    <div className="flex items-center justify-center gap-2 p-10 text-ink-400">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-[13px]">compiling…</span>
                    </div>
                  )}
                  {compileError && !compiling && (
                    <pre className="p-4 text-[11px] text-red-600 bg-red-50 whitespace-pre-wrap overflow-auto max-h-[300px]">
                      {compileError}
                    </pre>
                  )}
                  {pdfUrl && !compiling && (
                    <iframe
                      src={pdfUrl}
                      title="Resume PDF"
                      className="block w-full border-0 h-[70vh] md:h-[1000px] lg:h-[1100px]"
                    />
                  )}
                  {!pdfUrl && !compiling && !compileError && (
                    <div className="flex items-center justify-center h-full text-ink-300 text-[13px]">
                      hit recompile to preview
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>

          {/* Right rail — style */}
          {!styleCollapsed && (
            <aside className="w-full lg:w-64 lg:shrink-0 lg:sticky lg:top-24">
              <div className="border border-ink-200 rounded-md bg-cream text-[12px] lg:max-h-[calc(100vh-160px)] lg:overflow-y-auto">
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-crimson-600 bg-crimson-500">
                  <span className="font-mono text-[9px] text-white/80 tracking-caps uppercase flex items-center gap-1.5">
                    <Palette className="w-3 h-3" /> style
                  </span>
                  <button onClick={() => setStyleCollapsed(true)} className="text-white/60 hover:text-white transition-colors">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-4 space-y-5">

                  {/* Template */}
                  <div>
                    <p className="font-mono text-[9px] text-ink-400 tracking-caps uppercase mb-2">template</p>
                    <div className="grid grid-cols-3 gap-px bg-ink-200 border border-ink-200 rounded-sm overflow-hidden">
                      {(['classic', 'modern', 'compact'] as const).map(t => (
                        <button
                          key={t}
                          onClick={() => setStyleField('template', t)}
                          className={`py-1.5 text-[9px] font-mono tracking-caps uppercase transition-colors ${style.template === t ? 'bg-ink-900 text-cream' : 'bg-cream text-ink-500 hover:bg-ink-50'}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Columns */}
                  <div>
                    <p className="font-mono text-[9px] text-ink-400 tracking-caps uppercase mb-2">columns</p>
                    <div className="grid grid-cols-2 gap-px bg-ink-200 border border-ink-200 rounded-sm overflow-hidden">
                      {([1, 2] as const).map(c => (
                        <button
                          key={c}
                          onClick={() => setStyleField('columns', c)}
                          className={`py-1.5 text-[9px] font-mono tracking-caps uppercase transition-colors ${style.columns === c ? 'bg-ink-900 text-cream' : 'bg-cream text-ink-500 hover:bg-ink-50'}`}
                        >
                          {c} col
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Saved presets */}
                  {presets.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="font-mono text-[9px] text-ink-400 tracking-caps uppercase">saved presets</p>
                      {presets.map(preset => (
                        <button
                          key={preset.id}
                          onClick={() => handleLoadPreset(preset)}
                          className={`w-full flex items-center gap-2 p-2 rounded-sm border text-left transition-all group ${appliedPresetId === preset.id ? 'border-crimson-500/40 bg-crimson-500/5' : 'border-ink-200 hover:border-ink-900 bg-white'}`}
                        >
                          <div className="w-3.5 h-3.5 shrink-0 rounded-full border border-ink-200" style={{ background: preset.style_json.colors?.primary || '#000' }} />
                          <span className="flex-1 text-[11px] text-ink-800 truncate">{preset.name}</span>
                          {appliedPresetId === preset.id && <Check className="w-3 h-3 text-crimson-500 shrink-0" />}
                          <span
                            role="button"
                            onClick={e => handleDeletePreset(preset.id, e)}
                            className="opacity-0 group-hover:opacity-100 text-ink-300 hover:text-flare transition-all"
                          >
                            <Trash2 className="w-3 h-3" />
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Fonts */}
                  <div className="space-y-2">
                    <p className="font-mono text-[9px] text-ink-400 tracking-caps uppercase">fonts</p>
                    <div>
                      <label className="text-[10px] text-ink-500 mb-0.5 block">heading</label>
                      <select
                        value={style.fontFamily.heading}
                        onChange={e => setStyleNested('fontFamily', 'heading', e.target.value)}
                        className="w-full text-[11px] p-1.5 border border-ink-200 rounded-sm focus:outline-none focus:border-ink-900 bg-white"
                      >
                        {LATEX_FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-ink-500 mb-0.5 block">body</label>
                      <select
                        value={style.fontFamily.body}
                        onChange={e => setStyleNested('fontFamily', 'body', e.target.value)}
                        className="w-full text-[11px] p-1.5 border border-ink-200 rounded-sm focus:outline-none focus:border-ink-900 bg-white"
                      >
                        {LATEX_FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Accent color */}
                  <div>
                    <p className="font-mono text-[9px] text-ink-400 tracking-caps uppercase mb-2">accent color</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {COLOR_SWATCHES.map(c => (
                        <button
                          key={c}
                          onClick={() => setStyleNested('colors', 'primary', c)}
                          title={c}
                          className={`w-5 h-5 rounded-full border-2 transition-all ${style.colors.primary === c ? 'border-ink-900 scale-110' : 'border-transparent'}`}
                          style={{ background: c }}
                        />
                      ))}
                      <input
                        type="color"
                        value={style.colors.primary}
                        onChange={e => setStyleNested('colors', 'primary', e.target.value)}
                        className="w-5 h-5 rounded-full border border-ink-200 cursor-pointer"
                        title="Custom color"
                      />
                    </div>
                  </div>

                  {/* Font sizes */}
                  <div className="space-y-2">
                    <p className="font-mono text-[9px] text-ink-400 tracking-caps uppercase">font sizes</p>
                    {([
                      { key: 'name', label: 'name', min: 16, max: 28 },
                      { key: 'heading', label: 'sections', min: 10, max: 16 },
                      { key: 'body', label: 'body', min: 9, max: 13 },
                    ] as const).map(({ key, label, min, max }) => (
                      <div key={key} className="flex items-center gap-2">
                        <label className="text-[10px] text-ink-500 w-12 shrink-0">{label}</label>
                        <input
                          type="range" min={min} max={max} step={0.5}
                          value={style.fontSize[key]}
                          onChange={e => setStyleNested('fontSize', key, Number(e.target.value))}
                          className="flex-1 h-1 accent-ink-900"
                        />
                        <span className="text-[10px] text-ink-500 w-7 text-right num">{style.fontSize[key]}pt</span>
                      </div>
                    ))}
                  </div>

                  {/* Spacing */}
                  <div className="space-y-2">
                    <p className="font-mono text-[9px] text-ink-400 tracking-caps uppercase">spacing</p>
                    <div className="flex items-center gap-2">
                      <label className="text-[10px] text-ink-500 w-12 shrink-0">sections</label>
                      <input
                        type="range" min={6} max={24} step={1}
                        value={style.spacing.section}
                        onChange={e => setStyleNested('spacing', 'section', Number(e.target.value))}
                        className="flex-1 h-1 accent-ink-900"
                      />
                      <span className="text-[10px] text-ink-500 w-7 text-right num">{style.spacing.section}pt</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-[10px] text-ink-500 w-12 shrink-0">leading</label>
                      <input
                        type="range" min={1.0} max={1.8} step={0.05}
                        value={style.spacing.lineHeight}
                        onChange={e => setStyleNested('spacing', 'lineHeight', Number(e.target.value))}
                        className="flex-1 h-1 accent-ink-900"
                      />
                      <span className="text-[10px] text-ink-500 w-7 text-right num">{style.spacing.lineHeight.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Icons toggle */}
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-[9px] text-ink-400 tracking-caps uppercase">contact icons</p>
                    <button
                      onClick={() => setStyleField('showIcons', !style.showIcons)}
                      className={`relative w-8 h-4 rounded-full transition-colors ${style.showIcons ? 'bg-ink-900' : 'bg-ink-200'}`}
                    >
                      <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${style.showIcons ? 'left-4.5' : 'left-0.5'}`} />
                    </button>
                  </div>

                  {/* Default templates */}
                  <div>
                    <p className="font-mono text-[9px] text-ink-400 tracking-caps uppercase mb-2">base templates</p>
                    <div className="space-y-1">
                      {DEFAULT_TEMPLATES.map(t => (
                        <button
                          key={t.id}
                          onClick={() => { setLatex(t.latex); void compile(t.latex) }}
                          disabled={busy}
                          className="w-full flex items-start gap-2 p-2 rounded-sm border border-ink-200 hover:border-ink-900 bg-white text-left transition-all disabled:opacity-40"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-medium text-ink-800">{t.name}</p>
                            <p className="text-[10px] text-ink-400 truncate">{t.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Re-style button */}
                  <button
                    onClick={handleRestyle}
                    disabled={busy}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-crimson-500 hover:bg-crimson-600 disabled:opacity-50 text-cream text-[11px] font-bold tracking-caps uppercase rounded-sm transition-colors"
                  >
                    {restyling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Palette className="w-3.5 h-3.5" />}
                    {restyling ? 're-styling…' : 're-style resume'}
                  </button>

                  {restyleError && <p className="text-[11px] text-flare">{restyleError}</p>}

                  {/* Save as preset */}
                  {showSavePreset && (
                    <div className="space-y-2 p-3 bg-ink-50 border border-ink-200 rounded-sm">
                      <p className="font-mono text-[9px] text-ink-400 tracking-caps uppercase">save this style</p>
                      <input
                        type="text"
                        value={presetName}
                        onChange={e => setPresetName(e.target.value)}
                        placeholder="e.g. Modern Navy"
                        className="w-full text-[11px] p-1.5 border border-ink-200 rounded-sm focus:outline-none focus:border-ink-900 bg-white"
                        onKeyDown={e => e.key === 'Enter' && handleSavePreset()}
                      />
                      <button
                        onClick={handleSavePreset}
                        disabled={!presetName.trim() || savingPreset}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-ink-900 text-cream text-[10px] font-mono tracking-caps uppercase rounded-sm disabled:opacity-50"
                      >
                        {savingPreset ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        save preset
                      </button>
                    </div>
                  )}

                </div>
              </div>
            </aside>
          )}

        </div>
      </div>

      {/* Floating AI edit panel */}
      <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-md px-3 sm:px-4 pointer-events-none">
        <div className="pointer-events-auto flex flex-col items-center">
          <AnimatePresence mode="wait" initial={false}>
            {floatOpen ? (
              <motion.div
                key="panel"
                initial={{ opacity: 0, scale: 0.92, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 12 }}
                transition={{ type: 'spring', stiffness: 380, damping: 28, mass: 0.8 }}
                className="w-full rounded-2xl border border-ink-200/60 shadow-2xl overflow-hidden"
                style={GLASS_STYLE}
              >
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
                    <button onClick={() => setFloatOpen(false)} className="text-ink-400 hover:text-ink-900 transition-colors">
                      <Minimize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

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

                <div className="p-4 space-y-3">
                  <textarea
                    value={instruction}
                    onChange={e => setInstruction(e.target.value)}
                    onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleModify() }}
                    disabled={busy}
                    placeholder="Describe a change — e.g. 'make the summary more concise', 'add Python keywords', 'shorten to one page'…"
                    rows={3}
                    className="w-full text-[12px] p-3 border border-ink-300/70 rounded-lg focus:outline-none focus:border-ink-900 resize-none bg-white/60 placeholder:text-ink-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] text-ink-400 font-mono">⌘↵ to apply</span>
                    <button
                      onClick={handleModify}
                      disabled={!instruction.trim() || busy}
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
              </motion.div>
            ) : (
              <motion.button
                key="pill"
                onClick={() => setFloatOpen(true)}
                initial={{ opacity: 0, scale: 0.7, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.7, y: 8 }}
                transition={{ type: 'spring', stiffness: 420, damping: 26, mass: 0.7 }}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full shadow-xl border border-ink-900/10 text-[11px] font-mono tracking-caps uppercase text-ink-900"
                style={{ background: '#D7FF3A' }}
              >
                <Sparkles className="w-3 h-3 text-crimson-500" />
                ai edit
                {edits.length > 0 && (
                  <span className="px-1.5 py-0.5 bg-ink-900 text-cream text-[9px] rounded-full num leading-none">
                    {edits.length}
                  </span>
                )}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  )
}
