'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'

interface Props {
  historyId: string
  initialHtml: string
  jobTitle: string
  score: number
}

export default function ResumeEditorMinimal(props: Props) {
  const [html, setHtml] = useState(props.initialHtml)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/resume/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: props.historyId, html }),
      })
      if (res.ok) setSavedAt(Date.now())
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12">
      <Link href={`/dashboard/history/${props.historyId}`} className="inline-flex items-center gap-2 text-[13px] text-ink-500 hover:text-ink-900 mb-6">
        <ArrowLeft className="w-3.5 h-3.5" /> back
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="font-mono text-[10px] text-crimson-500 tracking-caps uppercase mb-2">resume editor</p>
          <h1 className="font-chunk text-[36px] tracking-tight text-ink-900">{props.jobTitle}</h1>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-ink-900 text-cream font-medium rounded-md hover:bg-crimson-500 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'saving…' : 'save'}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-8">
        <aside className="col-span-1 border border-ink-200 p-4 bg-cream rounded-md sticky top-24 h-fit">
          <p className="font-mono text-[10px] text-ink-500 tracking-caps uppercase mb-3">score</p>
          <div className="font-chunk text-[40px] text-ink-900 num">{props.score}</div>
        </aside>

        <main className="col-span-3 bg-white border border-ink-300 p-6 rounded-md min-h-[1000px]">
          <style>{`
            .resume-html { font-family: system-ui; font-size: 11pt; line-height: 1.4; }
            .resume-html h1 { font-size: 20pt; margin: 0 0 10px; }
            .resume-html h2 { font-size: 14pt; margin: 15px 0 8px; border-bottom: 1px solid #000; }
            .resume-html p { margin: 2px 0; }
          `}</style>
          <div
            className="resume-html"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </main>
      </div>
    </div>
  )
}
