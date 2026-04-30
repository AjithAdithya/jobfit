import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Check, X, Plus, Link, Code2, Globe, FileText, Loader2, Sparkles } from 'lucide-react'
import { useProfile, computeCompleteness } from '../hooks/useProfile'
import type { UserProfile } from '../hooks/useProfile'
import { supabase } from '../lib/supabase'
import { extractProfileFromResume } from '../lib/profileExtractor'
import { callClaude } from '../lib/anthropic'

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
  activeResumeId?: string | null
  activeResumeName?: string | null
  userEmail?: string | null
}

const ProfileView: React.FC<Props> = ({ userId, onBack, activeResumeId, activeResumeName, userEmail }) => {
  const { profile, loading, saving, savedAt, save } = useProfile(userId)
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState<string | null>(null)
  const [generatingBio, setGeneratingBio] = useState(false)
  const [generatingSummary, setGeneratingSummary] = useState(false)

  const [local, setLocal] = useState<Partial<UserProfile>>({})
  const [tagInput, setTagInput] = useState('')
  const [showSaved, setShowSaved] = useState(false)

  React.useEffect(() => {
    if (profile) setLocal(profile)
  }, [profile])

  // Pre-fill email from login when profile has none saved yet
  React.useEffect(() => {
    if (profile && !profile.email && userEmail) {
      setLocal(prev => ({ ...prev, email: userEmail }))
      save({ email: userEmail })
    }
  }, [profile, userEmail, save])

  React.useEffect(() => {
    if (savedAt) {
      setShowSaved(true)
      const t = setTimeout(() => setShowSaved(false), 2000)
      return () => clearTimeout(t)
    }
  }, [savedAt])

  // Update local state only — save happens on blur
  const patch = useCallback((updates: Partial<UserProfile>) => {
    setLocal(prev => ({ ...prev, ...updates }))
  }, [])

  // Persist to DB — call on blur for text fields
  const commit = useCallback((updates: Partial<UserProfile>) => {
    save(updates)
  }, [save])

  // Immediate update + save — for toggles, selects, tag buttons
  const patchAndCommit = useCallback((updates: Partial<UserProfile>) => {
    setLocal(prev => ({ ...prev, ...updates }))
    save(updates)
  }, [save])

  const completeness = computeCompleteness(local)

  const handleExtract = useCallback(async () => {
    if (!activeResumeId) return
    setExtracting(true)
    setExtractError(null)
    try {
      const { data: chunks } = await supabase
        .from('resume_chunkies')
        .select('content')
        .eq('resume_id', activeResumeId)
        .order('section')
      if (!chunks?.length) throw new Error('No resume content found')
      const text = chunks.map((c: { content: string }) => c.content).join('\n\n')
      const fields = await extractProfileFromResume(text)
      const merged: Partial<UserProfile> = {}
      for (const [k, v] of Object.entries(fields)) {
        const key = k as keyof UserProfile
        const cur = local[key]
        const empty = cur === null || cur === undefined || (typeof cur === 'string' && !cur.trim()) || (Array.isArray(cur) && !cur.length)
        if (empty) (merged as any)[key] = v
      }
      if (Object.keys(merged).length) {
        setLocal(prev => ({ ...prev, ...merged }))
        await save(merged)
      }
    } catch (err: any) {
      setExtractError(err.message || 'Extraction failed')
    } finally {
      setExtracting(false)
    }
  }, [activeResumeId, local, save])

  const buildProfileContext = () => {
    const parts: string[] = []
    if (local.full_name) parts.push(`Name: ${local.full_name}`)
    if (local.headline) parts.push(`Title: ${local.headline}`)
    if (local.seniority_level) parts.push(`Seniority: ${local.seniority_level}`)
    if (local.years_of_experience != null) parts.push(`Experience: ${local.years_of_experience} years`)
    if (local.target_roles?.length) parts.push(`Target roles: ${local.target_roles.join(', ')}`)
    if (local.target_industries?.length) parts.push(`Industries: ${local.target_industries.join(', ')}`)
    return parts.join('\n') || 'a software professional'
  }

  const generateBio = async () => {
    setGeneratingBio(true)
    try {
      const result = await callClaude(
        'You are a career advisor. Write a concise, first-person professional bio for job applications. Output only the bio text — no quotes, no labels, no preamble.',
        `Write a professional bio under 280 characters for:\n${buildProfileContext()}`,
        { model: 'claude-haiku-4-5', maxTokens: 150 }
      )
      const bio = result.trim().slice(0, 300)
      setLocal(prev => ({ ...prev, bio }))
      save({ bio })
    } catch { /* silent — user still has the field */ } finally {
      setGeneratingBio(false)
    }
  }

  const generateSummary = async () => {
    setGeneratingSummary(true)
    try {
      const ctx = buildProfileContext() + (local.bio ? `\nBio: ${local.bio}` : '')
      const result = await callClaude(
        'You are a career advisor. Write a compelling professional summary for a resume. 2–4 sentences, third person. Output only the summary text — no quotes, no labels.',
        `Write a professional resume summary for:\n${ctx}`,
        { model: 'claude-haiku-4-5', maxTokens: 300 }
      )
      const professional_summary = result.trim().slice(0, 800)
      setLocal(prev => ({ ...prev, professional_summary }))
      save({ professional_summary })
    } catch { /* silent */ } finally {
      setGeneratingSummary(false)
    }
  }

  const completionColor =
    completeness >= 80 ? 'bg-ink-900' :
    completeness >= 40 ? 'bg-citrus' :
    'bg-flare'

  const addRole = () => {
    const t = tagInput.trim()
    if (!t) return
    const roles = local.target_roles ?? []
    if (roles.length >= 5 || roles.includes(t)) return
    patchAndCommit({ target_roles: [...roles, t] })
    setTagInput('')
  }

  const removeRole = (r: string) =>
    patchAndCommit({ target_roles: (local.target_roles ?? []).filter(x => x !== r) })

  const toggleIndustry = (ind: string) => {
    const list = local.target_industries ?? []
    patchAndCommit({ target_industries: list.includes(ind) ? list.filter(x => x !== ind) : [...list, ind] })
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

      {/* ── Extract from resume card */}
      {activeResumeId && (
        <div className="mb-5 border border-ink-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-ink-100 shrink-0">
              <FileText className="w-4 h-4 text-ink-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-mono text-[9px] text-ink-400 tracking-caps uppercase mb-0.5">extract from resume</p>
              <p className="text-[12px] text-ink-900 font-medium truncate">{activeResumeName ?? 'Current resume'}</p>
            </div>
            <button
              onClick={handleExtract}
              disabled={extracting}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-ink-900 hover:bg-crimson-500 disabled:opacity-50 text-cream text-[10px] font-mono tracking-caps uppercase transition-colors"
            >
              {extracting
                ? <><Loader2 className="w-3 h-3 animate-spin" /> extracting…</>
                : <><Sparkles className="w-3 h-3" /> extract</>
              }
            </button>
          </div>
          <AnimatePresence>
            {extractError && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="font-mono text-[9px] text-flare mt-2 pt-2 border-t border-ink-100"
              >
                {extractError}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      )}

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
              onBlur={e => commit({ full_name: e.target.value || null })}
            />
          </Field>
          <Field label="Email">
            <input
              className={inputClass}
              type="email"
              value={local.email ?? ''}
              placeholder="you@example.com"
              onChange={e => patch({ email: e.target.value })}
              onBlur={e => commit({ email: e.target.value || null })}
            />
          </Field>
          <Field label="Headline" hint="Max 120 chars · shown below your name">
            <input
              className={inputClass}
              maxLength={120}
              value={local.headline ?? ''}
              placeholder="Senior Frontend Engineer"
              onChange={e => patch({ headline: e.target.value })}
              onBlur={e => commit({ headline: e.target.value || null })}
            />
          </Field>
          <Field label="Bio" hint="Max 300 chars">
            <div className="relative">
              <textarea
                className={`${inputClass} h-24 resize-none pr-10`}
                maxLength={300}
                value={local.bio ?? ''}
                placeholder="Brief summary of your background…"
                onChange={e => patch({ bio: e.target.value })}
                onBlur={e => commit({ bio: e.target.value || null })}
              />
              <button
                type="button"
                onClick={generateBio}
                disabled={generatingBio}
                title="AI generate bio"
                className="absolute bottom-2 right-2 p-1.5 bg-ink-100 hover:bg-crimson-500 text-ink-400 hover:text-cream disabled:opacity-40 transition-colors"
              >
                {generatingBio
                  ? <Loader2 className="w-3 h-3 animate-spin" />
                  : <Sparkles className="w-3 h-3" />
                }
              </button>
            </div>
          </Field>
          <Field label="Professional summary" hint="Shown in resume header · 2–4 sentences">
            <div className="relative">
              <textarea
                className={`${inputClass} h-28 resize-none pr-10`}
                value={local.professional_summary ?? ''}
                placeholder="Experienced engineer with a track record of…"
                onChange={e => patch({ professional_summary: e.target.value })}
                onBlur={e => commit({ professional_summary: e.target.value || null })}
              />
              <button
                type="button"
                onClick={generateSummary}
                disabled={generatingSummary}
                title="AI generate summary"
                className="absolute bottom-2 right-2 p-1.5 bg-ink-100 hover:bg-crimson-500 text-ink-400 hover:text-cream disabled:opacity-40 transition-colors"
              >
                {generatingSummary
                  ? <Loader2 className="w-3 h-3 animate-spin" />
                  : <Sparkles className="w-3 h-3" />
                }
              </button>
            </div>
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
              onChange={v => patchAndCommit({ job_type: v })}
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
              onChange={v => patchAndCommit({ remote_preference: v })}
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
              onChange={e => patchAndCommit({ seniority_level: e.target.value || null })}
            >
              <option value="">— select —</option>
              {SENIORITY.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </Field>
          <Field label="Years of experience">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => patchAndCommit({ years_of_experience: Math.max(0, (local.years_of_experience ?? 0) - 1) })}
                className="w-9 h-9 border border-ink-200 flex items-center justify-center text-ink-500 hover:border-ink-900 hover:text-ink-900 transition-colors text-lg font-light"
              >
                −
              </button>
              <span className="font-chunk text-[22px] text-ink-900 num w-12 text-center leading-none">
                {local.years_of_experience === 30 ? '30+' : (local.years_of_experience ?? 0)}
              </span>
              <button
                type="button"
                onClick={() => patchAndCommit({ years_of_experience: Math.min(30, (local.years_of_experience ?? 0) + 1) })}
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
              onBlur={e => commit({ location: e.target.value || null })}
            />
          </Field>
          <Field label="Open to relocate">
            <button
              type="button"
              onClick={() => patchAndCommit({ willing_to_relocate: !local.willing_to_relocate })}
              className={`relative w-10 h-5 rounded-full transition-colors ${local.willing_to_relocate ? 'bg-ink-900' : 'bg-ink-200'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${local.willing_to_relocate ? 'left-5' : 'left-0.5'}`} />
            </button>
          </Field>
          <Field label="Work authorization">
            <select
              className={`${inputClass} cursor-pointer`}
              value={local.visa_status ?? ''}
              onChange={e => patchAndCommit({ visa_status: e.target.value || null })}
            >
              <option value="">— select —</option>
              {VISA.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
            </select>
          </Field>
        </section>

        {/* ── Compensation */}
        <section className="space-y-4">
          <p className="font-mono text-[9px] text-ink-400 tracking-caps uppercase border-b border-ink-100 pb-1.5">compensation</p>
          <Field label="Annual salary (minimum)">
            <div className="flex gap-2">
              <input
                className={`${inputClass} w-20`}
                value={local.salary_currency ?? 'USD'}
                placeholder="USD"
                onChange={e => patch({ salary_currency: e.target.value.toUpperCase().slice(0, 3) })}
                onBlur={e => commit({ salary_currency: e.target.value.toUpperCase().slice(0, 3) || 'USD' })}
              />
              <input
                inputMode="numeric"
                className={`${inputClass} flex-1`}
                value={local.salary_min ?? ''}
                placeholder="120,000"
                onChange={e => {
                  const raw = e.target.value.replace(/[^0-9]/g, '')
                  patch({ salary_min: raw ? Number(raw) : null })
                }}
                onBlur={e => {
                  const raw = e.target.value.replace(/[^0-9]/g, '')
                  commit({ salary_min: raw ? Number(raw) : null })
                }}
              />
            </div>
          </Field>
          <Field label="Period">
            <Segment
              value={local.salary_period ?? null}
              onChange={v => patchAndCommit({ salary_period: v })}
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
                  onChange={e => patch({ [key]: e.target.value } as Partial<UserProfile>)}
                  onBlur={e => commit({ [key]: e.target.value || null } as Partial<UserProfile>)}
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
