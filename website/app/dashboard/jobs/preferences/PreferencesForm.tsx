'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'

const SENIORITY_LEVELS = ['intern', 'junior', 'mid', 'senior', 'staff', 'principal', 'exec'] as const
type Seniority = (typeof SENIORITY_LEVELS)[number]

const ROLE_SUGGESTIONS = [
  'Software Engineer', 'Frontend Engineer', 'Backend Engineer', 'Full-Stack Engineer',
  'Data Engineer', 'ML Engineer', 'Platform Engineer', 'DevOps / SRE',
  'Product Manager', 'Engineering Manager', 'Data Scientist', 'Security Engineer',
]

interface Resume { id: string; filename: string }

interface Prefs {
  roles_of_interest: string[]
  locations: string[]
  remote_ok: boolean
  hybrid_ok: boolean
  onsite_ok: boolean
  comp_min: number | null
  seniority_floor: Seniority | null
  seniority_ceiling: Seniority | null
  excluded_companies: string[]
  active_resume_id: string | null
  notify_email: boolean
}

interface Props {
  initial: Partial<Prefs>
  resumes: Resume[]
}

function ChipInput({
  label, values, onChange, suggestions,
}: { label: string; values: string[]; onChange: (v: string[]) => void; suggestions?: string[] }) {
  const [input, setInput] = useState('')

  const add = (val: string) => {
    const trimmed = val.trim()
    if (trimmed && !values.includes(trimmed)) onChange([...values, trimmed])
    setInput('')
  }

  return (
    <div>
      <label className="font-mono text-[10px] tracking-caps uppercase text-ink-500 block mb-2">{label}</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {values.map(v => (
          <span key={v} className="flex items-center gap-1 px-2.5 py-1 border border-ink-900 bg-cream font-mono text-[11px]">
            {v}
            <button onClick={() => onChange(values.filter(x => x !== v))} className="text-ink-400 hover:text-flare ml-1">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(input) } }}
          placeholder="Type and press Enter"
          className="flex-1 border border-ink-200 bg-white px-3 py-2 font-mono text-[12px] text-ink-900 placeholder:text-ink-300 focus:outline-none focus:border-ink-900"
        />
        <button
          onClick={() => add(input)}
          className="px-3 py-2 border border-ink-900 text-ink-900 hover:bg-ink-900 hover:text-cream transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      {suggestions && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {suggestions.filter(s => !values.includes(s)).slice(0, 8).map(s => (
            <button
              key={s}
              onClick={() => onChange([...values, s])}
              className="px-2 py-0.5 border border-ink-200 font-mono text-[10px] text-ink-500 hover:border-ink-900 hover:text-ink-900 transition-colors"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function PreferencesForm({ initial, resumes }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [roles, setRoles] = useState<string[]>(initial.roles_of_interest ?? [])
  const [locations, setLocations] = useState<string[]>(initial.locations ?? [])
  const [remoteOk, setRemoteOk] = useState(initial.remote_ok ?? true)
  const [hybridOk, setHybridOk] = useState(initial.hybrid_ok ?? true)
  const [onsiteOk, setOnsiteOk] = useState(initial.onsite_ok ?? true)
  const [compMin, setCompMin] = useState<string>(initial.comp_min ? String(initial.comp_min) : '')
  const [seniorityFloor, setSeniorityFloor] = useState<Seniority | ''>(initial.seniority_floor ?? '')
  const [seniorityCeiling, setSeniorityCeiling] = useState<Seniority | ''>(initial.seniority_ceiling ?? '')
  const [excluded, setExcluded] = useState<string[]>(initial.excluded_companies ?? [])
  const [activeResume, setActiveResume] = useState<string>(initial.active_resume_id ?? '')
  const [notifyEmail, setNotifyEmail] = useState(initial.notify_email ?? false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = () => {
    setError(null)
    setSaved(false)
    startTransition(async () => {
      try {
        const res = await fetch('/api/jobs/preferences', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roles_of_interest: roles,
            locations,
            remote_ok: remoteOk,
            hybrid_ok: hybridOk,
            onsite_ok: onsiteOk,
            comp_min: compMin ? parseInt(compMin, 10) : null,
            seniority_floor: seniorityFloor || null,
            seniority_ceiling: seniorityCeiling || null,
            excluded_companies: excluded,
            active_resume_id: activeResume || null,
            notify_email: notifyEmail,
          }),
        })
        if (!res.ok) {
          const { error: msg } = await res.json()
          setError(msg || 'Failed to save')
          return
        }
        setSaved(true)
        router.refresh()
      } catch (err: any) {
        setError(err.message || 'Network error')
      }
    })
  }

  const Toggle = ({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) => (
    <button
      onClick={() => onChange(!value)}
      className={`flex items-center gap-2 px-3 py-2 border font-mono text-[11px] tracking-caps uppercase transition-colors ${
        value ? 'border-ink-900 bg-ink-900 text-cream' : 'border-ink-200 text-ink-500 hover:border-ink-900'
      }`}
    >
      <span className={`w-2 h-2 rounded-full ${value ? 'bg-citrus' : 'bg-ink-300'}`} />
      {label}
    </button>
  )

  return (
    <div className="space-y-10">

      {/* Active resume */}
      <section>
        <p className="font-mono text-[10px] tracking-caps uppercase text-ink-500 mb-2">active resume</p>
        <select
          value={activeResume}
          onChange={e => setActiveResume(e.target.value)}
          className="w-full border border-ink-200 bg-white px-3 py-2.5 font-mono text-[12px] text-ink-900 focus:outline-none focus:border-ink-900"
        >
          <option value="">— select a resume —</option>
          {resumes.map(r => (
            <option key={r.id} value={r.id}>{r.filename}</option>
          ))}
        </select>
        <p className="font-mono text-[10px] text-ink-400 mt-1.5">jobs are scored against this resume. changing it will re-score your feed.</p>
      </section>

      {/* Roles */}
      <section>
        <ChipInput label="roles of interest" values={roles} onChange={setRoles} suggestions={ROLE_SUGGESTIONS} />
      </section>

      {/* Location */}
      <section>
        <ChipInput label="preferred locations" values={locations} onChange={setLocations} />
        <div className="flex flex-wrap gap-2 mt-3">
          <Toggle value={remoteOk} onChange={setRemoteOk} label="remote" />
          <Toggle value={hybridOk} onChange={setHybridOk} label="hybrid" />
          <Toggle value={onsiteOk} onChange={setOnsiteOk} label="on-site" />
        </div>
      </section>

      {/* Seniority band */}
      <section>
        <p className="font-mono text-[10px] tracking-caps uppercase text-ink-500 mb-2">seniority band</p>
        <div className="flex gap-3">
          {(['floor', 'ceiling'] as const).map(edge => (
            <div key={edge} className="flex-1">
              <p className="font-mono text-[9px] text-ink-400 uppercase tracking-caps mb-1">{edge}</p>
              <select
                value={edge === 'floor' ? seniorityFloor : seniorityCeiling}
                onChange={e => edge === 'floor'
                  ? setSeniorityFloor(e.target.value as Seniority | '')
                  : setSeniorityCeiling(e.target.value as Seniority | '')}
                className="w-full border border-ink-200 bg-white px-2.5 py-2 font-mono text-[11px] text-ink-900 focus:outline-none focus:border-ink-900"
              >
                <option value="">any</option>
                {SENIORITY_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          ))}
        </div>
      </section>

      {/* Comp floor */}
      <section>
        <p className="font-mono text-[10px] tracking-caps uppercase text-ink-500 mb-2">minimum comp (USD / year)</p>
        <input
          type="number"
          value={compMin}
          onChange={e => setCompMin(e.target.value)}
          placeholder="e.g. 120000"
          min={0}
          step={5000}
          className="w-full border border-ink-200 bg-white px-3 py-2 font-mono text-[12px] text-ink-900 placeholder:text-ink-300 focus:outline-none focus:border-ink-900"
        />
        <p className="font-mono text-[10px] text-ink-400 mt-1.5">jobs with disclosed comp below this are hidden. undisclosed comp is always shown.</p>
      </section>

      {/* Excluded companies */}
      <section>
        <ChipInput label="excluded companies" values={excluded} onChange={setExcluded} />
      </section>

      {/* Email digest */}
      <section className="border border-ink-200 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[11px] tracking-caps uppercase text-ink-900 mb-1">weekly email digest</p>
            <p className="font-mono text-[10px] text-ink-400">receive your top 5 new matches every Monday morning</p>
          </div>
          <Toggle value={notifyEmail} onChange={setNotifyEmail} label={notifyEmail ? 'on' : 'off'} />
        </div>
      </section>

      {/* Save */}
      <div className="flex items-center gap-4 pt-2">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="px-6 py-3 bg-ink-900 text-cream font-mono text-[11px] tracking-caps uppercase hover:bg-ink-800 transition-colors disabled:opacity-50"
        >
          {isPending ? 'saving…' : 'save preferences'}
        </button>
        {saved && <span className="font-mono text-[11px] text-citrus-600 tracking-caps uppercase">saved</span>}
        {error && <span className="font-mono text-[11px] text-flare tracking-caps">{error}</span>}
      </div>
    </div>
  )
}
