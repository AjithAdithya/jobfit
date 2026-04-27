'use client'
import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Save, Loader2, MessageSquarePlus, Type, Palette,
  AlignLeft, Check, X, Sparkles, FileText, RotateCcw, History,
} from 'lucide-react'

interface Props {
  historyId: string
  initialHtml: string
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
  before: string
  after: string
  comment: string
  at: number
}

interface PendingComment {
  selection: string
  range: Range | null
  rect: DOMRect
}

interface ResumeStyle {
  fontFamily: string
  fontSize: number
  lineHeight: number
  margin: number
  accent: string
  headingWeight: number
}

const FONT_OPTIONS = [
  { label: 'Inter', value: '"Inter", system-ui, sans-serif' },
  { label: 'Source Serif', value: '"Source Serif Pro", Georgia, serif' },
  { label: 'Merriweather', value: '"Merriweather", Georgia, serif' },
  { label: 'Roboto Mono', value: '"Roboto Mono", monospace' },
  { label: 'Helvetica', value: '"Helvetica Neue", Arial, sans-serif' },
  { label: 'Times', value: '"Times New Roman", Times, serif' },
]

const ACCENT_PRESETS = [
  { label: 'ink',     value: '#1c1917' },
  { label: 'crimson', value: '#c01414' },
  { label: 'sky',     value: '#3ba8d4' },
  { label: 'citrus',  value: '#9fbf25' },
  { label: 'navy',    value: '#1e3a8a' },
  { label: 'forest',  value: '#166534' },
]

const DEFAULT_STYLE: ResumeStyle = {
  fontFamily: '"Inter", system-ui, sans-serif',
  fontSize: 11,
  lineHeight: 1.45,
  margin: 36,
  accent: '#1c1917',
  headingWeight: 700,
}

function stripStyleBlock(html: string): { html: string; style: ResumeStyle } {
  const match = html.match(/<style[^>]*data-resume-style[^>]*>([\s\S]*?)<\/style>/i)
  if (!match) return { html, style: DEFAULT_STYLE }
  try {
    const json = match[1].match(/\/\*JSON:([\s\S]*?)\*\//)
    const parsed = json ? JSON.parse(json[1]) : DEFAULT_STYLE
    const cleaned = html.replace(match[0], '').trim()
    return { html: cleaned, style: { ...DEFAULT_STYLE, ...parsed } }
  } catch {
    return { html, style: DEFAULT_STYLE }
  }
}

function buildStyleBlock(style: ResumeStyle): string {
  const json = JSON.stringify(style)
  return `<style data-resume-style>/*JSON:${json}*/
.resume-doc { font-family: ${style.fontFamily}; font-size: ${style.fontSize}pt; line-height: ${style.lineHeight}; padding: ${style.margin}px; color: #111; }
.resume-doc h1 { font-family: ${style.fontFamily}; font-weight: ${style.headingWeight}; color: ${style.accent}; font-size: ${style.fontSize * 2}pt; margin: 0 0 6px; }
.resume-doc h2 { font-family: ${style.fontFamily}; font-weight: ${style.headingWeight}; color: ${style.accent}; font-size: ${style.fontSize * 1.25}pt; border-bottom: 1px solid ${style.accent}; padding-bottom: 2px; margin: 14px 0 6px; text-transform: uppercase; letter-spacing: 0.05em; }
.resume-doc h3 { font-weight: 600; font-size: ${style.fontSize * 1.05}pt; margin: 8px 0 2px; }
.resume-doc p, .resume-doc li { margin: 2px 0; }
.resume-doc ul { padding-left: 18px; margin: 4px 0 8px; }
</style>`
}

export default function ResumeEditor(props: Props) {
  const initial = useMemo(() => stripStyleBlock(props.initialHtml), [props.initialHtml])

  const [html, setHtml] = useState(initial.html)
  const [style, setStyle] = useState<ResumeStyle>(initial.style)
  const [edits, setEdits] = useState<EditEntry[]>([])
  const [pending, setPending] = useState<PendingComment | null>(null)
  const [comment, setComment] = useState('')
  const [variants, setVariants] = useState<string[] | null>(null)
  const [requesting, setRequesting] = useState(false)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'context' | 'history'>('context')
  const [stylePanel, setStylePanel] = useState<'typography' | 'spacing' | 'color'>('typography')

  const docRef = useRef<HTMLDivElement>(null)

  // Capture selection inside the resume
  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      setPending(null)
      return
    }
    const range = sel.getRangeAt(0)
    if (!docRef.current?.contains(range.commonAncestorContainer)) {
      setPending(null)
      return
    }
    const text = sel.toString().trim()
    if (text.length < 3) {
      setPending(null)
      return
    }
    const rect = range.getBoundingClientRect()
    setPending({ selection: text, range: range.cloneRange(), rect })
  }, [])

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp)
    return () => document.removeEventListener('mouseup', handleMouseUp)
  }, [handleMouseUp])

  const requestVariants = async () => {
    if (!pending || !comment.trim()) return
    setRequesting(true)
    setRequestError(null)
    setVariants(null)
    try {
      const res = await fetch('/api/resume/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selection: pending.selection,
          comment: comment.trim(),
          context: {
            fullResume: docRef.current?.innerText.slice(0, 6000) || '',
            jobTitle: props.jobTitle,
            keywords: props.selectedKeywords.length ? props.selectedKeywords : props.keywords,
            gaps: props.selectedGaps.length ? props.selectedGaps : props.gaps,
          },
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || `Server error ${res.status}`)
      setVariants(json.variants || [])
    } catch (err: any) {
      setRequestError(err.message)
    } finally {
      setRequesting(false)
    }
  }

  const applyVariant = (variant: string) => {
    if (!pending || !docRef.current) return
    const before = pending.selection
    const newHtml = docRef.current.innerHTML.replace(escapeForReplace(before), escapeReplacement(variant))
    setHtml(newHtml)
    setEdits(prev => [
      { id: crypto.randomUUID(), before, after: stripTags(variant), comment, at: Date.now() },
      ...prev,
    ])
    setPending(null)
    setVariants(null)
    setComment('')
  }

  const discardComment = () => {
    setPending(null)
    setVariants(null)
    setComment('')
    setRequestError(null)
    window.getSelection()?.removeAllRanges()
  }

  const undoEdit = (entryId: string) => {
    const entry = edits.find(e => e.id === entryId)
    if (!entry || !docRef.current) return
    const newHtml = docRef.current.innerHTML.replace(
      escapeForReplace(entry.after),
      escapeReplacement(entry.before)
    )
    setHtml(newHtml)
    setEdits(prev => prev.filter(e => e.id !== entryId))
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      const finalHtml = `${buildStyleBlock(style)}\n${html}`
      const res = await fetch('/api/resume/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: props.historyId, html: finalHtml }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || `Server error ${res.status}`)
      setSavedAt(Date.now())
    } catch (err: any) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const resetStyle = () => setStyle(DEFAULT_STYLE)

  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-6">
        <div>
          <Link href={`/dashboard/history/${props.historyId}`} className="inline-flex items-center gap-2 text-[13px] text-ink-500 hover:text-ink-900 mb-3">
            <ArrowLeft className="w-3.5 h-3.5" /> back to analysis
          </Link>
          <p className="font-mono text-[10px] text-crimson-500 tracking-caps uppercase mb-2">resume editor</p>
          <h1 className="font-chunk text-[36px] leading-tight tracking-tight text-ink-900">
            {props.jobTitle}
          </h1>
          <p className="text-[13px] text-ink-500 mt-1">{props.siteName}</p>
        </div>
        <div className="flex items-center gap-3">
          {savedAt && !saving && (
            <span className="text-[11px] text-ink-500 font-mono tracking-caps uppercase">
              saved · {new Date(savedAt).toLocaleTimeString()}
            </span>
          )}
          {saveError && <span className="text-[11px] text-flare">{saveError}</span>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-ink-900 text-cream font-medium text-[13px] rounded-md hover:bg-crimson-500 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            save resume
          </button>
        </div>
      </div>

      {/* 3-column grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left rail — context */}
        <aside className="col-span-3">
          <div className="border border-ink-200 rounded-md bg-cream sticky top-24">
            <div className="flex border-b border-ink-200">
              {(['context', 'history'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-3 py-2.5 text-[11px] font-mono tracking-caps uppercase transition-colors ${
                    activeTab === tab ? 'bg-ink-900 text-cream' : 'text-ink-500 hover:text-ink-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === 'context' && (
              <div className="p-4 space-y-5 text-[12px] max-h-[calc(100vh-200px)] overflow-y-auto">
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
                          <span
                            key={i}
                            className={`px-2 py-0.5 text-[10px] rounded-sm border ${
                              on ? 'bg-ink-900 text-cream border-ink-900' : 'border-ink-300 text-ink-500'
                            }`}
                          >
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

                {/* Base resume preview */}
                {props.baseResumeText && (
                  <details className="border-t border-ink-200 pt-3">
                    <summary className="font-mono text-[9px] text-ink-400 tracking-caps uppercase cursor-pointer hover:text-ink-900">
                      view source resume content
                    </summary>
                    <pre className="mt-2 text-[10px] text-ink-600 whitespace-pre-wrap leading-relaxed max-h-[200px] overflow-y-auto p-2 bg-ink-50 rounded-sm font-sans">
                      {props.baseResumeText.slice(0, 3000)}
                      {props.baseResumeText.length > 3000 && '\n\n…(truncated)'}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                <p className="font-mono text-[9px] text-ink-400 tracking-caps uppercase mb-3">
                  edits this session · <span className="num">{edits.length}</span>
                </p>
                {edits.length === 0 ? (
                  <p className="text-[11px] text-ink-400 italic">no changes yet. select text in the resume to comment.</p>
                ) : (
                  <ul className="space-y-3">
                    {edits.map(e => (
                      <li key={e.id} className="border border-ink-200 rounded-sm p-2.5 bg-white">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <p className="font-serif italic text-[11px] text-crimson-500 leading-snug flex-1">"{e.comment}"</p>
                          <button
                            onClick={() => undoEdit(e.id)}
                            className="text-ink-400 hover:text-flare shrink-0"
                            title="Undo"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-[10px] text-ink-400 line-through line-clamp-2 mb-1">{e.before}</div>
                        <div className="text-[10px] text-ink-900 line-clamp-2">{e.after}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* Center — resume preview */}
        <main className="col-span-6">
          <div className="bg-white border border-ink-300 shadow-sm relative">
            <style dangerouslySetInnerHTML={{ __html: stylesheetFor(style) }} />
            <div
              ref={docRef}
              className="resume-doc resume-editable min-h-[1100px]"
              dangerouslySetInnerHTML={{ __html: html }}
            />

            {/* Selection callout */}
            {pending && !variants && !requesting && (
              <div
                className="fixed z-50 bg-ink-900 text-cream rounded-md shadow-print-xl p-3 flex items-center gap-2 animate-in fade-in"
                style={{
                  top: pending.rect.bottom + window.scrollY + 8,
                  left: Math.min(pending.rect.left + window.scrollX, window.innerWidth - 320),
                  width: 300,
                }}
              >
                <MessageSquarePlus className="w-4 h-4 text-citrus shrink-0" />
                <span className="text-[12px] flex-1 line-clamp-1">comment on selection</span>
                <button onClick={discardComment} className="text-cream/60 hover:text-cream">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </main>

        {/* Right rail — comment / variants / styles */}
        <aside className="col-span-3 space-y-4">
          {/* Comment + variants box */}
          {pending ? (
            <div className="border border-ink-900 rounded-md bg-cream sticky top-24">
              <div className="px-4 py-2.5 border-b border-ink-200 flex items-center justify-between">
                <p className="font-mono text-[10px] text-crimson-500 tracking-caps uppercase">rewrite selection</p>
                <button onClick={discardComment} className="text-ink-400 hover:text-ink-900">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-4">
                <div className="text-[11px] text-ink-500 mb-3 p-2 bg-ink-50 border-l-2 border-crimson-500 line-clamp-4">
                  "{pending.selection}"
                </div>

                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Make this more concrete with metrics. Or: shorten to one line. Or: emphasize Python."
                  rows={3}
                  className="w-full text-[12px] p-2 border border-ink-300 rounded-sm focus:outline-none focus:border-ink-900 resize-none mb-3"
                />

                {!variants && (
                  <button
                    onClick={requestVariants}
                    disabled={!comment.trim() || requesting}
                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-ink-900 text-cream text-[12px] font-medium rounded-md hover:bg-crimson-500 disabled:opacity-50"
                  >
                    {requesting ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> generating 3 options…</>
                    ) : (
                      <><Sparkles className="w-3.5 h-3.5" /> generate 3 variants</>
                    )}
                  </button>
                )}

                {requestError && (
                  <p className="mt-2 text-[11px] text-flare">{requestError}</p>
                )}

                {variants && (
                  <div className="space-y-2 mt-2">
                    <p className="font-mono text-[9px] text-ink-400 tracking-caps uppercase">pick a variant</p>
                    {variants.map((v, i) => (
                      <button
                        key={i}
                        onClick={() => applyVariant(v)}
                        className="w-full text-left p-2.5 border border-ink-300 rounded-sm hover:border-ink-900 hover:bg-ink-50 transition-colors group"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="font-mono text-[9px] text-crimson-500 tracking-caps">option {String(i + 1).padStart(2, '0')}</span>
                          <Check className="w-3 h-3 text-ink-300 group-hover:text-citrus" />
                        </div>
                        <div className="text-[11px] text-ink-700 leading-snug" dangerouslySetInnerHTML={{ __html: v }} />
                      </button>
                    ))}
                    <button
                      onClick={() => { setVariants(null); setComment('') }}
                      className="w-full px-3 py-1.5 border border-ink-300 text-ink-500 text-[11px] rounded-sm hover:border-ink-900 hover:text-ink-900"
                    >
                      try a different instruction
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-ink-300 rounded-md p-4 text-center bg-cream sticky top-24">
              <MessageSquarePlus className="w-5 h-5 text-ink-300 mx-auto mb-2" />
              <p className="font-mono text-[10px] text-ink-500 tracking-caps uppercase mb-1">comment to rewrite</p>
              <p className="text-[11px] text-ink-400 leading-snug">
                Highlight any text in the resume to leave a comment and generate three rewrite options.
              </p>
            </div>
          )}

          {/* Style controls */}
          <div className="border border-ink-200 rounded-md bg-cream">
            <div className="flex border-b border-ink-200">
              {([
                { id: 'typography', label: 'type', icon: Type },
                { id: 'spacing', label: 'space', icon: AlignLeft },
                { id: 'color', label: 'color', icon: Palette },
              ] as const).map(t => (
                <button
                  key={t.id}
                  onClick={() => setStylePanel(t.id)}
                  className={`flex-1 px-2 py-2 text-[10px] font-mono tracking-caps uppercase inline-flex items-center justify-center gap-1.5 transition-colors ${
                    stylePanel === t.id ? 'bg-ink-900 text-cream' : 'text-ink-500 hover:text-ink-900'
                  }`}
                >
                  <t.icon className="w-3 h-3" />
                  {t.label}
                </button>
              ))}
            </div>

            <div className="p-4 space-y-4">
              {stylePanel === 'typography' && (
                <>
                  <Field label="font family">
                    <select
                      value={style.fontFamily}
                      onChange={e => setStyle(s => ({ ...s, fontFamily: e.target.value }))}
                      className="w-full text-[12px] px-2 py-1.5 border border-ink-300 rounded-sm focus:outline-none focus:border-ink-900"
                    >
                      {FONT_OPTIONS.map(f => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                  </Field>

                  <Slider label="font size" suffix="pt" min={8} max={14} step={0.5}
                    value={style.fontSize}
                    onChange={v => setStyle(s => ({ ...s, fontSize: v }))} />

                  <Slider label="heading weight" suffix="" min={400} max={900} step={100}
                    value={style.headingWeight}
                    onChange={v => setStyle(s => ({ ...s, headingWeight: v }))} />
                </>
              )}

              {stylePanel === 'spacing' && (
                <>
                  <Slider label="line height" suffix="" min={1.0} max={2.0} step={0.05}
                    value={style.lineHeight}
                    onChange={v => setStyle(s => ({ ...s, lineHeight: v }))} />

                  <Slider label="page margin" suffix="px" min={16} max={72} step={2}
                    value={style.margin}
                    onChange={v => setStyle(s => ({ ...s, margin: v }))} />
                </>
              )}

              {stylePanel === 'color' && (
                <Field label="accent color">
                  <div className="grid grid-cols-3 gap-1.5">
                    {ACCENT_PRESETS.map(c => (
                      <button
                        key={c.value}
                        onClick={() => setStyle(s => ({ ...s, accent: c.value }))}
                        className={`flex flex-col items-center gap-1 p-2 border rounded-sm hover:border-ink-900 ${
                          style.accent === c.value ? 'border-ink-900' : 'border-ink-200'
                        }`}
                      >
                        <div className="w-5 h-5 rounded-full" style={{ background: c.value }} />
                        <span className="font-mono text-[9px] tracking-caps uppercase text-ink-500">{c.label}</span>
                      </button>
                    ))}
                  </div>
                  <input
                    type="color"
                    value={style.accent}
                    onChange={e => setStyle(s => ({ ...s, accent: e.target.value }))}
                    className="mt-2 w-full h-8 border border-ink-300 rounded-sm cursor-pointer"
                  />
                </Field>
              )}

              <button
                onClick={resetStyle}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-1.5 border border-ink-200 text-ink-500 text-[11px] rounded-sm hover:border-ink-900 hover:text-ink-900"
              >
                <RotateCcw className="w-3 h-3" /> reset to defaults
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-mono text-[9px] text-ink-400 tracking-caps uppercase mb-1.5">{label}</p>
      {children}
    </div>
  )
}

function Slider({ label, suffix, min, max, step, value, onChange }: {
  label: string; suffix: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <p className="font-mono text-[9px] text-ink-400 tracking-caps uppercase">{label}</p>
        <span className="font-mono text-[10px] text-ink-900 num">{value}{suffix}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full accent-ink-900"
      />
    </div>
  )
}

function stylesheetFor(s: ResumeStyle): string {
  return `
    .resume-editable { font-family: ${s.fontFamily}; font-size: ${s.fontSize}pt; line-height: ${s.lineHeight}; padding: ${s.margin}px; color: #111; }
    .resume-editable h1 { font-family: ${s.fontFamily}; font-weight: ${s.headingWeight}; color: ${s.accent}; font-size: ${s.fontSize * 2}pt; margin: 0 0 6px; }
    .resume-editable h2 { font-family: ${s.fontFamily}; font-weight: ${s.headingWeight}; color: ${s.accent}; font-size: ${s.fontSize * 1.25}pt; border-bottom: 1px solid ${s.accent}; padding-bottom: 2px; margin: 14px 0 6px; text-transform: uppercase; letter-spacing: 0.05em; }
    .resume-editable h3 { font-weight: 600; font-size: ${s.fontSize * 1.05}pt; margin: 8px 0 2px; }
    .resume-editable p, .resume-editable li { margin: 2px 0; }
    .resume-editable ul { padding-left: 18px; margin: 4px 0 8px; }
    .resume-editable ::selection { background: ${s.accent}33; }
  `
}

function escapeForReplace(text: string): string {
  return text
}

function escapeReplacement(text: string): string {
  return text.replace(/\$/g, '$$$$')
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim()
}
