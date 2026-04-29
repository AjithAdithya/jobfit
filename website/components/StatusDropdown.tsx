'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

const STATUSES = ['Evaluating', 'Applied', 'Interviewing', 'Offer', 'Rejected'] as const

const STATUS_STYLE: Record<string, string> = {
  Evaluating:   'border-ink-300 text-ink-500 bg-transparent',
  Applied:      'border-sky text-sky bg-sky/5',
  Interviewing: 'border-ink-900 text-ink-900 bg-ink-900/5',
  Offer:        'border-citrus text-ink-900 bg-citrus',
  Rejected:     'border-flare text-flare bg-flare/5',
}

export default function StatusDropdown({ id, initial }: { id: string; initial: string }) {
  const [status, setStatus] = useState(initial || 'Evaluating')
  const [saving, setSaving] = useState(false)

  const handleChange = async (next: string) => {
    setStatus(next)
    setSaving(true)
    const supabase = createClient()
    await supabase.from('analysis_history').update({ status: next }).eq('id', id)
    setSaving(false)
  }

  return (
    <div className="relative inline-flex items-center gap-2">
      <select
        value={status}
        onChange={e => handleChange(e.target.value)}
        disabled={saving}
        className={`font-mono text-[11px] tracking-caps uppercase px-4 py-2 border appearance-none cursor-pointer focus:outline-none disabled:opacity-60 ${STATUS_STYLE[status] ?? STATUS_STYLE.Evaluating}`}
      >
        {STATUSES.map(s => (
          <option key={s} value={s}>{s.toLowerCase()}</option>
        ))}
      </select>
      {saving && <Loader2 className="w-3 h-3 animate-spin text-ink-400 absolute right-2 pointer-events-none" />}
    </div>
  )
}
