import React, { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Check, X, Plus, Link, Code2, Globe } from 'lucide-react'
import { useProfile, computeCompleteness } from '../hooks/useProfile'
import type { UserProfile } from '../hooks/useProfile'

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

interface SegmentProps {
  options: { value: string; label: string }[]
  value: string | null
  onChange: (v: string) => void
}
const Segment: React.FC<SegmentProps> = ({ options, value, onChange }) => (
  <div className="flex flex-wrap gap-1.5">
    {options.map(o => (
      <button
        key={o.value}
        type="button"
        onClick={() => onChange(o.value)}
        className={`px-3 py-1.5 text-[10px] font-mono tracking-caps uppercase border transition-colors ${
          value === o.value
            ? 'bg-ink-900 text-cream border-ink-900'
            : 'bg-white text-ink-500 border-ink-200 hover:border-ink-500'
        }`}
      >
        {o.label}
      </button>
    ))}
  </div>
)

interface FieldProps { label: string; children: React.ReactNode; hint?: string }
const Field: React.FC<FieldProps> = ({ label, children, hint }) => (
  <div className="space-y-2">
    <label className="font-mono text-[9px] text-ink-400 tracking-caps uppercase block">{label}</label>
    {children}
    {hint && <p className="font-mono text-[9px] text-ink-300">{hint}</p>}
  </div>
)

interface Props {
  userId: string
  onBack: () => void
}

const ProfileView: React.FC<Props> = ({ userId, onBack }) => {
  const { profile, loading, saving, savedAt, save } = useProfile(userId)

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [local, setLocal] = useState<Partial<UserProfile>>({})
  const [tagInput, setTagInput] = useState('')
  const [showSaved, setShowSaved] = useState(false)

  React.useEffect(() => {
    if (profile) setLocal(profile)
  }, [profile])

  React.useEffect(() => {
    if (savedAt) {
      setShowSaved(true)
      const t = setTimeout(() => setShowSaved(false), 2000)
      return () => clearTimeout(t)
    }
  }, [savedAt])

  const patch = useCallback((updates: Partial<UserProfile>) => {
    const next = { ...local, ...updates }
    setLocal(next)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => save(updates), 600)
  }, [local, save])

  const completeness = computeCompleteness(local)

  const completionColor =
    completeness >= 80 ? 'bg-ink-900' :
    completeness >= 40 ? 'bg-citrus' :
    'bg-flare'

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

  const inputClass = "w-full px-3 py-2 bg-white border border-ink-200 text-[12px] text-ink-900 focus:outline-none focus:border-crimson-500 placeholder:text-ink-300"

  if (loading) return (
    <div className="flex items-center justify-center h-32">
      <span className="font-mono text-[10px] text-ink-400 tracking-caps uppercase animate-pulse">loading profile…</span>
    </div>
  )

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={onBack}
          className="text-xs font-bold text-ink-500 hover:text-ink-900 uppercase tracking-widest flex items-center gap-2 transition-colors"
        >
          <ArrowRight className="w-4 h-4 rotate-180" /> Back
        </button>
        <AnimatePresence>
          {showSaved && (
            <motion.span
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1 font-mono text-[9px] text-ink-400 tracking-caps uppercase"
            >
              <Check className="w-3 h-3 text-citrus" /> saved
            </motion.span>
          )}
          {saving && !showSaved && (
            <span className="font-mono text-[9px] text-ink-300 tracking-caps uppercase animate-pulse">saving…</span>
          )}
        </AnimatePresence>
      </div>

      {/* Title + progress */}
      <div className="mb-5">
        <p className="font-mono text-[9px] text-crimson-500 tracking-caps uppercase mb-1">my profile</p>
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="font-chunk text-[22px] tracking-tight text-ink-900 leading-none">candidate profile</h2>
          <span className="font-mono text-[10px] text-ink-500 num">{completeness}%</span>
        </div>
        <div className="h-1 bg-ink-100 w-full">
          <motion.div
            className={`h-full ${completionColor} transition-colors`}
            animate={{ width: `${completeness}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>

      <div className="space-y-6 pb-8">
        {/* ── Identity */}
        <section className="space-y-4">
          <p className="font-mono text-[9px] text-ink-400 tracking-caps uppercase border-b border-ink-100 pb-1.5">identity</p>
          <Field label="Full name">
            <input
              className={inputClass}
              value={local.full_name ?? ''}
              placeholder="Ada Lovelace"
              onChange={e => patch({ full_name: e.target.value })}
            />
          </Field>
          <Field label="Headline" hint="Max 120 chars · shown below your name">
            <input
              className={inputClass}
              maxLength={120}
              value={local.headline ?? ''}
              placeholder="Senior Frontend Engineer"
              onChange={e => patch({ headline: e.target.value })}
            />
          </Field>
          <Field label="Bio" hint="Max 300 chars">
            <textarea
              className={`${inputClass} h-20 resize-none`}
              maxLength={300}
              value={local.bio ?? ''}
              placeholder="Brief summary of your background…"
              onChange={e => patch({ bio: e.target.value })}
            />
          </Field>
        </section>

        {/* ── Job Preferences */}
        <section className="space-y-4">
          <p className="font-mono text-[9px] text-ink-400 tracking-caps uppercase border-b border-ink-100 pb-1.5">job preferences</p>
          <Field label="Target roles" hint="Up to 5 — press Enter to add">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(local.target_roles ?? []).map(r => (
                <span key={r} className="flex items-center gap-1 px-2 py-1 bg-ink-900 text-cream text-[10px] font-mono">
                  {r}
                  <button type="button" onClick={() => removeRole(r)} className="text-cream/50 hover:text-cream">
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
                  className="px-3 py-2 bg-ink-900 text-cream hover:bg-crimson-500 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </Field>
          <Field label="Industries">
            <div className="flex flex-wrap gap-1.5">
              {INDUSTRIES.map(ind => {
                const on = (local.target_industries ?? []).includes(ind)
                return (
                  <button
                    key={ind}
                    type="button"
                    onClick={() => toggleIndustry(ind)}
                    className={`px-2.5 py-1 text-[10px] font-mono border transition-colors ${
                      on ? 'bg-ink-900 text-cream border-ink-900' : 'bg-white text-ink-500 border-ink-200 hover:border-ink-500'
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
        </section>

        {/* ── Experience */}
        <section className="space-y-4">
          <p className="font-mono text-[9px] text-ink-400 tracking-caps uppercase border-b border-ink-100 pb-1.5">experience</p>
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
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => patch({ years_of_experience: Math.max(0, (local.years_of_experience ?? 0) - 1) })}
                className="w-9 h-9 border border-ink-200 flex items-center justify-center text-ink-500 hover:border-ink-900 hover:text-ink-900 transition-colors text-lg font-light"
              >
                −
              </button>
              <span className="font-chunk text-[22px] text-ink-900 num w-12 text-center leading-none">
                {local.years_of_experience === 30 ? '30+' : (local.years_of_experience ?? 0)}
              </span>
              <button
                type="button"
                onClick={() => patch({ years_of_experience: Math.min(30, (local.years_of_experience ?? 0) + 1) })}
                className="w-9 h-9 border border-ink-200 flex items-center justify-center text-ink-500 hover:border-ink-900 hover:text-ink-900 transition-colors text-lg font-light"
              >
                +
              </button>
              <span className="font-mono text-[9px] text-ink-400 tracking-caps uppercase">years</span>
            </div>
          </Field>
        </section>

        {/* ── Location & Authorization */}
        <section className="space-y-4">
          <p className="font-mono text-[9px] text-ink-400 tracking-caps uppercase border-b border-ink-100 pb-1.5">location & authorization</p>
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
              className={`relative w-10 h-5 rounded-full transition-colors ${local.willing_to_relocate ? 'bg-ink-900' : 'bg-ink-200'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${local.willing_to_relocate ? 'left-5' : 'left-0.5'}`} />
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
        </section>

        {/* ── Compensation */}
        <section className="space-y-4">
          <p className="font-mono text-[9px] text-ink-400 tracking-caps uppercase border-b border-ink-100 pb-1.5">compensation</p>
          <Field label="Minimum salary">
            <div className="flex gap-2">
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
        </section>

        {/* ── Links */}
        <section className="space-y-4">
          <p className="font-mono text-[9px] text-ink-400 tracking-caps uppercase border-b border-ink-100 pb-1.5">links</p>
          {[
            { key: 'linkedin_url' as const, label: 'LinkedIn', icon: <Link className="w-3.5 h-3.5" />, placeholder: 'linkedin.com/in/…' },
            { key: 'github_url' as const, label: 'GitHub', icon: <Code2 className="w-3.5 h-3.5" />, placeholder: 'github.com/…' },
            { key: 'portfolio_url' as const, label: 'Portfolio', icon: <Globe className="w-3.5 h-3.5" />, placeholder: 'yoursite.com' },
          ].map(({ key, label, icon, placeholder }) => (
            <Field key={key} label={label}>
              <div className="flex items-center gap-0">
                <span className="px-2.5 h-9 flex items-center border border-r-0 border-ink-200 text-ink-400 bg-ink-50">
                  {icon}
                </span>
                <input
                  className="flex-1 px-3 h-9 bg-white border border-ink-200 text-[12px] text-ink-900 focus:outline-none focus:border-crimson-500 placeholder:text-ink-300"
                  value={(local[key] as string) ?? ''}
                  placeholder={placeholder}
                  onChange={e => patch({ [key]: e.target.value || null } as Partial<UserProfile>)}
                />
              </div>
            </Field>
          ))}
        </section>
      </div>
    </div>
  )
}

export default ProfileView
