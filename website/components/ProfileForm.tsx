'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Plus, X, Linkedin, Github, Globe, FileText, ChevronDown, Loader2, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { computeCompleteness, completenessColor } from '@/lib/profileUtils'
import type { UserProfile } from '@/lib/profileUtils'

const INDUSTRIES = [
  'Software', 'Fintech', 'Healthcare', 'E-commerce', 'EdTech',
  'Gaming', 'Cybersecurity', 'Data & AI', 'DevTools', 'Consumer',
  'Enterprise SaaS', 'Climate', 'Media', 'Consulting', 'Government', 'Other',
]

const SENIORITY = [
  { value: 'entry', label: 'Entry' },
  { value: 'mid', label: 'Mid' },
  { value: 'senior', label: 'Senior' },
  { value: 'staff', label: 'Staff' },
  { value: 'lead', label: 'Lead' },
  { value: 'principal', label: 'Principal' },
  { value: 'director', label: 'Director' },
  { value: 'vp', label: 'VP' },
  { value: 'c_suite', label: 'C-Suite' },
]

const VISA = [
  { value: 'us_citizen', label: 'US Citizen' },
  { value: 'permanent_resident', label: 'Permanent Resident' },
  { value: 'h1b', label: 'H-1B' },
  { value: 'f1_opt', label: 'F-1 OPT' },
  { value: 'need_sponsorship', label: 'Need Sponsorship' },
  { value: 'no_restrictions', label: 'No Restrictions' },
  { value: 'other', label: 'Other' },
]

function Segment({ options, value, onChange }: {
  options: { value: string; label: string }[]
  value: string | null
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`px-4 py-2 text-[12px] font-mono tracking-caps uppercase border transition-colors ${
            value === o.value
              ? 'bg-ink-900 text-cream border-ink-900'
              : 'bg-white text-ink-500 border-ink-300 hover:border-ink-600'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <label className="font-mono text-[10px] text-ink-400 tracking-caps uppercase block">{label}</label>
      {children}
      {hint && <p className="font-mono text-[10px] text-ink-300">{hint}</p>}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-6">
      <div className="border-b border-ink-200 pb-2">
        <p className="font-mono text-[10px] text-ink-400 tracking-caps uppercase">{title}</p>
      </div>
      {children}
    </section>
  )
}

const inputClass = "w-full px-4 py-3 bg-white border border-ink-300 text-[14px] text-ink-900 focus:outline-none focus:border-crimson-500 placeholder:text-ink-300 transition-colors"

export default function ProfileForm({ initial, userId }: { initial: Partial<UserProfile> | null; userId: string }) {
  const supabase = createClient()
  const [local, setLocal] = useState<Partial<UserProfile>>(initial ?? {})
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [showSaved, setShowSaved] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Extract from resume
  const [resumes, setResumes] = useState<{ id: string; file_name: string }[]>([])
  const [selectedResumeId, setSelectedResumeId] = useState<string>('')
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('resumes')
      .select('id, file_name')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data?.length) {
          setResumes(data)
          setSelectedResumeId(data[0].id)
        }
      })
  }, [supabase])

  useEffect(() => {
    if (savedAt) {
      setShowSaved(true)
      const t = setTimeout(() => setShowSaved(false), 2500)
      return () => clearTimeout(t)
    }
  }, [savedAt])

  const patch = useCallback(async (updates: Partial<UserProfile>) => {
    const next = { ...local, ...updates }
    setLocal(next)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setSaving(true)
      const merged = { ...next, user_id: userId, updated_at: new Date().toISOString() }
      await supabase.from('user_profiles').upsert(merged, { onConflict: 'user_id' })
      setSaving(false)
      setSavedAt(Date.now())
    }, 600)
  }, [local, userId, supabase])

  const handleExtract = useCallback(async () => {
    if (!selectedResumeId) return
    setExtracting(true)
    setExtractError(null)
    try {
      const res = await fetch('/api/profile/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId: selectedResumeId }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Extraction failed')
      }
      const fields: Partial<UserProfile> = await res.json()
      // Only fill in currently empty fields
      const merged: Partial<UserProfile> = {}
      for (const [k, v] of Object.entries(fields)) {
        const key = k as keyof UserProfile
        const cur = local[key]
        const empty = cur === null || cur === undefined || (typeof cur === 'string' && !(cur as string).trim()) || (Array.isArray(cur) && !(cur as unknown[]).length)
        if (empty) (merged as Record<string, unknown>)[key] = v
      }
      if (Object.keys(merged).length) await patch(merged)
    } catch (err: any) {
      setExtractError(err.message || 'Extraction failed')
    } finally {
      setExtracting(false)
    }
  }, [selectedResumeId, local, patch])

  const addRole = () => {
    const t = tagInput.trim()
    if (!t) return
    const roles = local.target_roles ?? []
    if (roles.length >= 5 || roles.includes(t)) return
    patch({ target_roles: [...roles, t] })
    setTagInput('')
  }

  const removeRole = (r: string) =>
    patch({ target_roles: (local.target_roles ?? []).filter(x => x !== r) })

  const toggleIndustry = (ind: string) => {
    const list = local.target_industries ?? []
    patch({ target_industries: list.includes(ind) ? list.filter(x => x !== ind) : [...list, ind] })
  }

  const completeness = computeCompleteness(local)
  const barColor = completenessColor(completeness)

  return (
    <div className="space-y-10">
      {/* Extract from resume card */}
      {resumes.length > 0 && (
        <div className="border border-ink-200 bg-white p-6">
          <p className="font-mono text-[10px] text-ink-400 tracking-caps uppercase mb-4">extract from resume</p>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-ink-100 shrink-0">
              <FileText className="w-5 h-5 text-ink-500" />
            </div>
            <div className="relative flex-1">
              <select
                className="w-full appearance-none pl-4 pr-10 py-3 bg-white border border-ink-300 text-[14px] text-ink-900 focus:outline-none focus:border-crimson-500 cursor-pointer"
                value={selectedResumeId}
                onChange={e => setSelectedResumeId(e.target.value)}
              >
                {resumes.map(r => (
                  <option key={r.id} value={r.id}>{r.file_name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
            </div>
            <button
              onClick={handleExtract}
              disabled={extracting || !selectedResumeId}
              className="shrink-0 flex items-center gap-2 px-5 py-3 bg-ink-900 hover:bg-crimson-500 disabled:opacity-50 text-cream text-[12px] font-mono tracking-caps uppercase transition-colors"
            >
              {extracting
                ? <><Loader2 className="w-4 h-4 animate-spin" /> extracting…</>
                : <><Sparkles className="w-4 h-4" /> extract</>
              }
            </button>
          </div>
          <AnimatePresence>
            {extractError && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="font-mono text-[11px] text-flare mt-3 pt-3 border-t border-ink-100"
              >
                {extractError}
              </motion.p>
            )}
          </AnimatePresence>
          <p className="font-mono text-[10px] text-ink-300 tracking-caps uppercase mt-3">
            only fills empty fields — existing data is not overwritten
          </p>
        </div>
      )}

      {/* Progress header */}
      <div className="border border-ink-200 bg-white p-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-mono text-[10px] text-ink-400 tracking-caps uppercase mb-1">profile completeness</p>
            <p className="font-chunk text-[28px] text-ink-900 leading-none num">
              {completeness}<span className="text-[16px] text-ink-400 ml-1">/100</span>
            </p>
          </div>
          <AnimatePresence mode="wait">
            {showSaved ? (
              <motion.span
                key="saved"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 font-mono text-[10px] text-ink-400 tracking-caps uppercase"
              >
                <Check className="w-3.5 h-3.5 text-citrus" /> saved
              </motion.span>
            ) : saving ? (
              <motion.span
                key="saving"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-mono text-[10px] text-ink-300 tracking-caps uppercase animate-pulse"
              >
                saving…
              </motion.span>
            ) : null}
          </AnimatePresence>
        </div>
        <div className="h-1.5 bg-ink-100 w-full">
          <motion.div
            className={`h-full ${barColor} transition-colors`}
            animate={{ width: `${completeness}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* ── Identity */}
      <Section title="identity">
        <Field label="Full name">
          <input
            className={inputClass}
            value={local.full_name ?? ''}
            placeholder="Ada Lovelace"
            onChange={e => patch({ full_name: e.target.value })}
          />
        </Field>
        <Field label="Headline" hint="Max 120 characters — shown below your name">
          <input
            className={inputClass}
            maxLength={120}
            value={local.headline ?? ''}
            placeholder="Senior Frontend Engineer"
            onChange={e => patch({ headline: e.target.value })}
          />
        </Field>
        <Field label="Bio" hint="Max 300 characters">
          <textarea
            className={`${inputClass} h-28 resize-none`}
            maxLength={300}
            value={local.bio ?? ''}
            placeholder="Brief summary of your background and what you're looking for…"
            onChange={e => patch({ bio: e.target.value })}
          />
        </Field>
      </Section>

      {/* ── Job Preferences */}
      <Section title="job preferences">
        <Field label="Target roles" hint="Up to 5 — press Enter to add">
          <div className="flex flex-wrap gap-2 mb-3">
            {(local.target_roles ?? []).map(r => (
              <span key={r} className="flex items-center gap-1.5 px-3 py-1.5 bg-ink-900 text-cream text-[12px] font-mono">
                {r}
                <button type="button" onClick={() => removeRole(r)} className="text-cream/50 hover:text-cream transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          {(local.target_roles ?? []).length < 5 && (
            <div className="flex gap-2">
              <input
                className={`${inputClass} flex-1`}
                value={tagInput}
                placeholder="e.g. Staff Engineer"
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addRole() } }}
              />
              <button
                type="button"
                onClick={addRole}
                className="px-4 py-3 bg-ink-900 text-cream hover:bg-crimson-500 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}
        </Field>

        <Field label="Industries">
          <div className="flex flex-wrap gap-2">
            {INDUSTRIES.map(ind => {
              const on = (local.target_industries ?? []).includes(ind)
              return (
                <button
                  key={ind}
                  type="button"
                  onClick={() => toggleIndustry(ind)}
                  className={`px-3 py-2 text-[12px] font-mono border transition-colors ${
                    on ? 'bg-ink-900 text-cream border-ink-900' : 'bg-white text-ink-500 border-ink-300 hover:border-ink-600'
                  }`}
                >
                  {ind}
                </button>
              )
            })}
          </div>
        </Field>

        <Field label="Job type">
          <Segment
            value={local.job_type ?? null}
            onChange={v => patch({ job_type: v })}
            options={[
              { value: 'full_time', label: 'Full-time' },
              { value: 'part_time', label: 'Part-time' },
              { value: 'contract', label: 'Contract' },
              { value: 'freelance', label: 'Freelance' },
              { value: 'internship', label: 'Internship' },
            ]}
          />
        </Field>

        <Field label="Remote preference">
          <Segment
            value={local.remote_preference ?? null}
            onChange={v => patch({ remote_preference: v })}
            options={[
              { value: 'remote', label: 'Remote' },
              { value: 'hybrid', label: 'Hybrid' },
              { value: 'onsite', label: 'On-site' },
              { value: 'flexible', label: 'Flexible' },
            ]}
          />
        </Field>
      </Section>

      {/* ── Experience */}
      <Section title="experience">
        <Field label="Seniority level">
          <select
            className={`${inputClass} cursor-pointer`}
            value={local.seniority_level ?? ''}
            onChange={e => patch({ seniority_level: e.target.value || null })}
          >
            <option value="">— select —</option>
            {SENIORITY.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </Field>

        <Field label="Years of experience">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => patch({ years_of_experience: Math.max(0, (local.years_of_experience ?? 0) - 1) })}
              className="w-10 h-10 border border-ink-300 flex items-center justify-center text-ink-500 hover:border-ink-900 hover:text-ink-900 transition-colors text-xl font-light"
            >
              −
            </button>
            <span className="font-chunk text-[32px] text-ink-900 num w-16 text-center leading-none">
              {local.years_of_experience === 30 ? '30+' : (local.years_of_experience ?? 0)}
            </span>
            <button
              type="button"
              onClick={() => patch({ years_of_experience: Math.min(30, (local.years_of_experience ?? 0) + 1) })}
              className="w-10 h-10 border border-ink-300 flex items-center justify-center text-ink-500 hover:border-ink-900 hover:text-ink-900 transition-colors text-xl font-light"
            >
              +
            </button>
            <span className="font-mono text-[10px] text-ink-400 tracking-caps uppercase">years</span>
          </div>
        </Field>
      </Section>

      {/* ── Location & Authorization */}
      <Section title="location & authorization">
        <Field label="Location">
          <input
            className={inputClass}
            value={local.location ?? ''}
            placeholder="San Francisco, CA"
            onChange={e => patch({ location: e.target.value })}
          />
        </Field>

        <Field label="Open to relocate">
          <button
            type="button"
            onClick={() => patch({ willing_to_relocate: !local.willing_to_relocate })}
            className="flex items-center gap-3"
          >
            <span className={`relative w-12 h-6 rounded-full transition-colors ${local.willing_to_relocate ? 'bg-ink-900' : 'bg-ink-200'}`}>
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${local.willing_to_relocate ? 'left-7' : 'left-1'}`} />
            </span>
            <span className="text-[13px] text-ink-700">{local.willing_to_relocate ? 'Yes, open to relocation' : 'Not looking to relocate'}</span>
          </button>
        </Field>

        <Field label="Work authorization">
          <select
            className={`${inputClass} cursor-pointer`}
            value={local.visa_status ?? ''}
            onChange={e => patch({ visa_status: e.target.value || null })}
          >
            <option value="">— select —</option>
            {VISA.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
          </select>
        </Field>
      </Section>

      {/* ── Compensation */}
      <Section title="compensation expectations">
        <Field label="Minimum salary">
          <div className="flex gap-3">
            <input
              className={`${inputClass} w-24`}
              value={local.salary_currency ?? 'USD'}
              onChange={e => patch({ salary_currency: e.target.value.toUpperCase().slice(0, 3) })}
              placeholder="USD"
            />
            <input
              type="number"
              className={`${inputClass} flex-1`}
              value={local.salary_min ?? ''}
              placeholder="120000"
              onChange={e => patch({ salary_min: e.target.value ? Number(e.target.value) : null })}
            />
          </div>
        </Field>
        <Field label="Period">
          <Segment
            value={local.salary_period ?? null}
            onChange={v => patch({ salary_period: v })}
            options={[
              { value: 'annual', label: 'Annual' },
              { value: 'monthly', label: 'Monthly' },
              { value: 'hourly', label: 'Hourly' },
            ]}
          />
        </Field>
      </Section>

      {/* ── Links */}
      <Section title="links">
        {[
          { key: 'linkedin_url' as const, label: 'LinkedIn', icon: <Linkedin className="w-4 h-4" />, placeholder: 'linkedin.com/in/yourname' },
          { key: 'github_url' as const, label: 'GitHub', icon: <Github className="w-4 h-4" />, placeholder: 'github.com/yourname' },
          { key: 'portfolio_url' as const, label: 'Portfolio', icon: <Globe className="w-4 h-4" />, placeholder: 'yoursite.com' },
        ].map(({ key, label, icon, placeholder }) => (
          <Field key={key} label={label}>
            <div className="flex">
              <span className="px-4 flex items-center border border-r-0 border-ink-300 text-ink-400 bg-ink-50">
                {icon}
              </span>
              <input
                className="flex-1 px-4 py-3 bg-white border border-ink-300 text-[14px] text-ink-900 focus:outline-none focus:border-crimson-500 placeholder:text-ink-300 transition-colors"
                value={(local[key] as string) ?? ''}
                placeholder={placeholder}
                onChange={e => patch({ [key]: e.target.value || null } as Partial<UserProfile>)}
              />
            </div>
          </Field>
        ))}
      </Section>
    </div>
  )
}
