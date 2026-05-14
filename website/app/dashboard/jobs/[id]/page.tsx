import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getMatchLevel } from '@/lib/matchLevel'
import { ExternalLink, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import TailorPanel from './TailorPanel'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const SUBSCORE_LABELS: Record<string, { label: string; weight: string }> = {
  hard_skills:      { label: 'Hard skills',      weight: '25%' },
  experience_years: { label: 'Experience',        weight: '15%' },
  responsibility:   { label: 'Responsibility',    weight: '15%' },
  domain:           { label: 'Domain',            weight: '10%' },
  seniority:        { label: 'Seniority fit',     weight: '10%' },
  impact:           { label: 'Impact metrics',    weight: '10%' },
  soft_skills:      { label: 'Soft skills',       weight: '5%' },
  education:        { label: 'Education',         weight: '5%' },
  logistics:        { label: 'Logistics',         weight: '5%' },
}

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: scoreRow, error } = await supabase
    .from('job_scores')
    .select('*, curated_jobs(*)')
    .eq('job_id', params.id)
    .eq('user_id', user.id)
    .eq('stale', false)
    .maybeSingle()

  if (error || !scoreRow) notFound()

  const job = scoreRow.curated_jobs as any
  const level = getMatchLevel(scoreRow.score)
  const subscores: Record<string, number> = scoreRow.subscores ?? {}
  const matches: string[] = scoreRow.matches ?? []
  const gaps: string[] = scoreRow.gaps ?? []
  const keywords: string[] = scoreRow.keywords ?? []

  function relativeDate(iso: string): string {
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400_000)
    if (days === 0) return 'today'
    if (days === 1) return 'yesterday'
    if (days < 7) return `${days}d ago`
    if (days < 30) return `${Math.floor(days / 7)}w ago`
    return `${Math.floor(days / 30)}mo ago`
  }

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-10 py-10 lg:py-16">

      {/* Back */}
      <Link href="/dashboard/jobs" className="inline-flex items-center gap-1.5 font-mono text-[10px] text-ink-400 hover:text-ink-900 tracking-caps uppercase mb-8 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        job feed
      </Link>

      {/* Header */}
      <div className="border-b border-ink-200 pb-8 mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="font-mono text-[10px] tracking-caps uppercase px-2 py-1 bg-ink-50 text-ink-500">
                {job.source}
              </span>
              {job.location_type && (
                <span className="font-mono text-[10px] tracking-caps uppercase px-2 py-1 bg-sky/10 text-sky">
                  {job.location_type}
                </span>
              )}
              {job.role_family && (
                <span className="font-mono text-[10px] tracking-caps uppercase px-2 py-1 bg-ink-50 text-ink-400">
                  {job.role_family}
                </span>
              )}
              <span className="font-mono text-[10px] text-ink-400 self-center">
                posted {relativeDate(job.posted_at)}
              </span>
            </div>
            <h1 className="font-chunk text-[clamp(1.8rem,5vw,3rem)] tracking-tightest text-ink-900 leading-tight mb-2">
              {job.job_title}
            </h1>
            <p className="font-mono text-[13px] text-ink-500">
              {job.company}
              {job.location && <span className="text-ink-300"> · {job.location}</span>}
              {(job.comp_min || job.comp_max) && (
                <span className="text-ink-400 ml-2">
                  · {job.comp_currency} {job.comp_min?.toLocaleString()}
                  {job.comp_max && `–${job.comp_max.toLocaleString()}`}
                </span>
              )}
            </p>
          </div>

          {/* Score */}
          <div className="text-right shrink-0">
            <div className="font-chunk text-[4rem] leading-none tracking-tightest" style={{ color: level.hex }}>
              {scoreRow.score}
            </div>
            <div className="font-mono text-[10px] text-ink-500 tracking-caps uppercase">{level.label}</div>
            <div className="font-mono text-[9px] text-ink-300 mt-0.5">{scoreRow.confidence} confidence</div>
          </div>
        </div>

        <a
          href={job.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 mt-4 font-mono text-[11px] tracking-caps uppercase text-crimson-500 hover:text-crimson-700 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          view original posting
        </a>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
        {/* Left column — sub-scores + analysis */}
        <div className="lg:col-span-2 space-y-8">

          {/* 9-dimension sub-score bars */}
          <section>
            <p className="font-mono text-[10px] tracking-caps uppercase text-ink-500 mb-4">match breakdown</p>
            <div className="space-y-3">
              {Object.entries(SUBSCORE_LABELS).map(([key, { label, weight }]) => {
                const val = subscores[key] ?? 0
                const barLevel = getMatchLevel(val)
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[11px] text-ink-700">{label}</span>
                      <span className="font-mono text-[10px] text-ink-400">{weight} · <span className="num">{val}</span>/100</span>
                    </div>
                    <div className="h-1.5 bg-ink-100 w-full">
                      <div
                        className="h-full transition-all"
                        style={{ width: `${val}%`, backgroundColor: barLevel.hex }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            {(scoreRow.caps_applied ?? []).length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {(scoreRow.caps_applied as string[]).map(cap => (
                  <span key={cap} className="px-2 py-1 font-mono text-[9px] tracking-caps uppercase bg-flare/10 text-flare border border-flare/20">
                    {cap}
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* Matches */}
          {matches.length > 0 && (
            <section>
              <p className="font-mono text-[10px] tracking-caps uppercase text-ink-500 mb-3">strengths</p>
              <ul className="space-y-2">
                {matches.map((m, i) => (
                  <li key={i} className="flex items-start gap-2.5 font-serif italic text-[14px] text-ink-700">
                    <span className="text-citrus-600 mt-0.5">+</span>
                    {m}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Gaps */}
          {gaps.length > 0 && (
            <section>
              <p className="font-mono text-[10px] tracking-caps uppercase text-ink-500 mb-3">gaps to address</p>
              <ul className="space-y-2">
                {gaps.map((g, i) => (
                  <li key={i} className="flex items-start gap-2.5 font-serif italic text-[14px] text-ink-700">
                    <span className="text-flare mt-0.5">−</span>
                    {g}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Keywords */}
          {keywords.length > 0 && (
            <section>
              <p className="font-mono text-[10px] tracking-caps uppercase text-ink-500 mb-3">keywords to include</p>
              <div className="flex flex-wrap gap-2">
                {keywords.map(kw => (
                  <span key={kw} className="px-2.5 py-1 border border-ink-200 font-mono text-[11px] text-ink-700">
                    {kw}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Full JD */}
          <section>
            <p className="font-mono text-[10px] tracking-caps uppercase text-ink-500 mb-3">job description</p>
            <div className="border border-ink-100 p-5 max-h-96 overflow-y-auto">
              <pre className="font-sans text-[13px] text-ink-700 leading-relaxed whitespace-pre-wrap break-words">
                {job.job_description}
              </pre>
            </div>
          </section>
        </div>

        {/* Right column — tailor panel */}
        <div className="space-y-4">
          <TailorPanel
            jobId={params.id}
            jobTitle={job.job_title}
            company={job.company}
          />
        </div>
      </div>
    </div>
  )
}
