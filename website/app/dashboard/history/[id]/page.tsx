import { createClient } from '@/lib/supabase/server'
import { getMatchLevel } from '@/lib/matchLevel'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowUpRight, Check, Pencil } from 'lucide-react'
import StatusDropdown from '@/components/StatusDropdown'
import HistoryResumePreview from '@/components/HistoryResumePreview'
import ResumeVersionsList from '@/components/ResumeVersionsList'
import MissingRequirementsRibbon from '@/components/MissingRequirementsRibbon'
import HardRequirementsRibbon from '@/components/HardRequirementsRibbon'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function HistoryDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: item } = await supabase
    .from('analysis_history')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!item) notFound()

  const level = getMatchLevel(item.score)
  const matches: string[] = item.matches || []
  const gaps: string[] = item.gaps || []
  const keywords: string[] = item.keywords || []
  const selectedGaps: string[] = item.selected_gaps || []
  const selectedKeywords: string[] = item.selected_keywords || []

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-10">

      {/* Back */}
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-[14px] text-ink-500 hover:text-ink-900 transition-colors mb-8 lg:mb-12">
        <ArrowLeft className="w-4 h-4" /> back to dashboard
      </Link>

      {/* Header */}
      <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 mb-10 lg:mb-16 lg:items-end">
        <div className="lg:col-span-8">
          <p className="font-mono text-[11px] text-crimson-500 tracking-caps uppercase mb-4">№ job · {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toLowerCase()}</p>
          <h1 className="font-chunk text-[clamp(2rem,7vw,4.5rem)] leading-[1.02] tracking-tightest text-ink-900 break-words">
            {item.job_title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-3 text-[14px] text-ink-500">
            <span>{item.site_name}</span>
            {item.job_url && (
              <>
                <span className="text-ink-300">·</span>
                <a href={item.job_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-crimson-500 transition-colors break-all">
                  view posting <ArrowUpRight className="w-3 h-3 shrink-0" />
                </a>
              </>
            )}
          </div>
        </div>
        <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-start lg:items-end gap-3">
          <StatusDropdown id={item.id} initial={item.status} />
          {item.generated_resume && (
            <Link
              href={`/dashboard/history/${item.id}/edit`}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-ink-900 text-cream font-medium text-[13px] rounded-md hover:bg-crimson-500 transition-colors whitespace-nowrap"
            >
              <Pencil className="w-3.5 h-3.5" /> open resume editor
            </Link>
          )}
        </div>
      </div>

      {/* Hard requirements ribbon — mandatory qualifications missing from resume */}
      <HardRequirementsRibbon requirements={item.hard_requirements || []} />

      {/* Missing requirements ribbon — general gaps mapped to categories */}
      <MissingRequirementsRibbon gaps={gaps.filter(g => !selectedGaps.includes(g))} />

      {/* Compatibility card */}
      <div className="relative border border-ink-900 bg-ink-900 text-cream p-6 sm:p-10 lg:p-14 mb-10 lg:mb-16">
        <p className="font-mono text-[10px] text-citrus tracking-caps uppercase mb-4">compatibility</p>
        <div className="grid grid-cols-12 gap-4 sm:gap-6 items-end">
          <div className="col-span-12 sm:col-span-8">
            <h2 className="font-chunk text-[clamp(2rem,7vw,5rem)] leading-[0.98] tracking-tight text-cream">
              {level.label.split(' ')[0]} <span className="serif-accent" style={{ color: level.hex }}>{level.label.split(' ').slice(1).join(' ') || 'fit'}</span>
            </h2>
            <p className="text-[14px] sm:text-[16px] italic font-serif text-cream/70 mt-2">{level.subtitle}</p>
          </div>
          <div className="col-span-12 sm:col-span-4 text-left sm:text-right">
            <span className="num font-chunk text-[clamp(3.5rem,12vw,7.5rem)] leading-none tracking-tightest text-cream">{item.score}</span>
            <span className="num text-[16px] text-cream/50 ml-1">/100</span>
          </div>
        </div>

        {/* Level bar */}
        <div className="mt-10 flex gap-[2px]">
          {[0,1,2,3,4,5,6,7,8,9].map(i => {
            const lit = i < Math.ceil(item.score / 10)
            return (
              <div
                key={i}
                className={`h-2 flex-1 ${lit ? '' : 'bg-cream/10'}`}
                style={lit ? { background: `linear-gradient(90deg, ${level.gradientFrom}, ${level.gradientTo})` } : {}}
              />
            )
          })}
        </div>
        <div className="mt-2 flex justify-between">
          <span className="font-mono text-[9px] text-cream/40 tracking-caps uppercase">no fit</span>
          <span className="font-mono text-[9px] text-cream/40 tracking-caps uppercase">elite</span>
        </div>
      </div>

      {/* Strengths + Gaps */}
      <div className="grid md:grid-cols-2 gap-8 mb-10 lg:mb-16">
        {/* Matching strengths */}
        <div>
          <div className="flex items-baseline justify-between border-b border-ink-900 pb-3 mb-5">
            <p className="font-mono text-[10px] text-ink-500 tracking-caps uppercase">matching strengths</p>
            <span className="num font-chunk text-[24px] text-ink-900 leading-none">
              <span>{matches.length}</span>
              <span className="text-ink-300"> / {matches.length + gaps.length}</span>
            </span>
          </div>
          <ul className="space-y-3">
            {matches.map((m, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="font-mono text-[11px] text-ink-400 num tracking-caps mt-1">{String(i+1).padStart(2,'0')}</span>
                <span className="text-[14px] text-ink-700 leading-relaxed">{m}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Gaps */}
        <div>
          <div className="flex items-baseline justify-between border-b border-ink-900 pb-3 mb-5">
            <p className="font-mono text-[10px] text-ink-500 tracking-caps uppercase">gaps</p>
            <span className="font-mono text-[10px] text-ink-500 tracking-caps uppercase">
              <span className="num text-ink-900">{selectedGaps.length}</span> addressed · <span className="num">{gaps.length}</span> total
            </span>
          </div>
          <ul className="space-y-3">
            {gaps.map((g, i) => {
              const on = selectedGaps.includes(g)
              return (
                <li key={i} className="flex items-start gap-3">
                  <div className={`w-4 h-4 border flex items-center justify-center flex-shrink-0 mt-0.5 ${on ? 'bg-citrus border-citrus' : 'border-ink-300'}`}>
                    {on && <Check className="w-3 h-3 text-ink-900 stroke-[3]" />}
                  </div>
                  <span className={`text-[14px] leading-relaxed ${on ? 'text-ink-900' : 'text-ink-500'}`}>{g}</span>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      {/* Keywords */}
      {keywords.length > 0 && (
        <div className="mb-16">
          <div className="flex items-baseline justify-between border-b border-ink-900 pb-3 mb-5">
            <p className="font-mono text-[10px] text-ink-500 tracking-caps uppercase">target keywords</p>
            <span className="font-mono text-[10px] text-ink-500 tracking-caps uppercase">
              <span className="num text-ink-900">{selectedKeywords.length}</span> / <span className="num">{keywords.length}</span> selected
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {keywords.map((k, i) => {
              const on = selectedKeywords.includes(k)
              return (
                <span
                  key={i}
                  className={`px-3 py-1.5 text-[13px] border rounded-sm ${on ? 'bg-ink-900 text-cream border-ink-900' : 'border-ink-300 text-ink-500'}`}
                >
                  {k}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Generated resume */}
      {item.generated_resume && (
        <div className="mb-16">
          <div className="flex items-baseline justify-between border-b border-ink-900 pb-3 mb-5">
            <p className="font-mono text-[10px] text-crimson-500 tracking-caps uppercase">generated resume</p>
            <div className="flex items-center gap-3">
              <Link
                href={`/dashboard/history/${item.id}/edit`}
                className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-caps uppercase px-3 py-1 bg-ink-900 text-cream rounded-sm hover:bg-crimson-500 transition-colors"
              >
                <Pencil className="w-3 h-3" /> edit
              </Link>
              <span className="font-mono text-[10px] text-ink-500 tracking-caps uppercase bg-citrus text-ink-900 px-2 py-0.5">available</span>
            </div>
          </div>
          <HistoryResumePreview source={item.generated_resume} />
        </div>
      )}

      {/* Version history */}
      {item.generated_resume && (
        <div className="mb-16">
          <div className="flex items-baseline justify-between border-b border-ink-900 pb-3 mb-5">
            <p className="font-mono text-[10px] text-crimson-500 tracking-caps uppercase">version history</p>
            <span className="font-mono text-[10px] text-ink-500 tracking-caps uppercase">all generated versions</span>
          </div>
          <ResumeVersionsList historyId={item.id} />
        </div>
      )}

      {/* Cover letter */}
      {item.cover_letter && (
        <div className="mb-16">
          <div className="flex items-baseline justify-between border-b border-ink-900 pb-3 mb-5">
            <p className="font-mono text-[10px] text-crimson-500 tracking-caps uppercase">cover letter</p>
            {item.cover_letter_tone && (
              <span className="font-mono text-[10px] text-ink-500 tracking-caps uppercase">{item.cover_letter_tone.toLowerCase()} tone</span>
            )}
          </div>
          <div className="p-6 bg-white border border-ink-200 text-[14px] text-ink-700 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto font-serif">
            {item.cover_letter}
          </div>
        </div>
      )}
    </div>
  )
}
