import { createClient } from '@/lib/supabase/server'
import { getMatchLevel } from '@/lib/matchLevel'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

const STATUS_STYLE: Record<string, string> = {
  Evaluating:   'border-ink-300 text-ink-500',
  Applied:      'border-sky text-sky bg-sky/5',
  Interviewing: 'border-ink-900 text-ink-900 bg-ink-900/5',
  Offer:        'border-citrus text-ink-900 bg-citrus',
  Rejected:     'border-flare text-flare bg-flare/5',
}

async function getStats(userId: string, supabase: ReturnType<typeof createClient>) {
  const { data: history } = await supabase
    .from('analysis_history')
    .select('id, job_title, job_url, site_name, score, status, created_at, generated_resume')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  const { data: resumes } = await supabase
    .from('resumes')
    .select('id')
    .eq('user_id', userId)

  const items = history || []
  const avgScore = items.length > 0
    ? Math.round(items.reduce((a, c) => a + c.score, 0) / items.length)
    : 0

  const statusCounts = items.reduce((acc: Record<string, number>, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1
    return acc
  }, {})

  return { items, avgScore, statusCounts, resumeCount: resumes?.length || 0 }
}

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { items, avgScore, statusCounts, resumeCount } = await getStats(user.id, supabase)
  const recent = items.slice(0, 10)
  const name = user.user_metadata?.full_name?.split(' ')[0] || 'friend'

  return (
    <div className="max-w-[1280px] mx-auto px-6 lg:px-10">

      {/* Header */}
      <div className="grid lg:grid-cols-12 gap-8 items-end mb-16">
        <div className="lg:col-span-8">
          <p className="font-mono text-[11px] text-crimson-500 tracking-caps uppercase mb-4">№ 01 — dashboard</p>
          <h1 className="font-chunk text-[clamp(3rem,7vw,6rem)] leading-[0.98] tracking-tightest text-ink-900">
            hey, <span className="serif-accent text-crimson-500">{name}</span>.
          </h1>
          <p className="mt-4 text-[16px] text-ink-500 italic font-serif">here's your job search, at a glance.</p>
        </div>
        <div className="lg:col-span-4 flex items-center justify-start lg:justify-end gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-crimson-500 animate-pulse" />
          <span className="font-mono text-[10px] text-ink-500 tracking-caps uppercase">synced from extension</span>
        </div>
      </div>

      {/* Stats — editorial */}
      <div className="grid md:grid-cols-4 border-t border-l border-ink-900 mb-12">
        {[
          { num: '01', value: String(items.length).padStart(2, '0'), label: 'jobs analyzed' },
          { num: '02', value: String(avgScore).padStart(2, '0'), label: 'avg match', suffix: '/100' },
          { num: '03', value: String(statusCounts.Interviewing || 0).padStart(2, '0'), label: 'interviewing' },
          { num: '04', value: String(resumeCount).padStart(2, '0'), label: 'resumes in vault' },
        ].map(stat => (
          <div key={stat.num} className="border-r border-b border-ink-900 p-8 bg-cream">
            <p className="font-mono text-[10px] text-ink-400 tracking-caps uppercase mb-6">№ {stat.num}</p>
            <div className="flex items-baseline gap-1">
              <span className="font-chunk text-[clamp(3rem,6vw,5rem)] leading-none tracking-tightest text-ink-900">{stat.value}</span>
              {stat.suffix && <span className="num text-[16px] text-ink-400">{stat.suffix}</span>}
            </div>
            <p className="font-mono text-[10px] text-ink-500 tracking-caps uppercase mt-4">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Pipeline */}
      {items.length > 0 && (
        <div className="mb-16">
          <p className="font-mono text-[10px] text-ink-500 tracking-caps uppercase mb-4">pipeline</p>
          <div className="flex flex-wrap gap-2">
            {['Evaluating', 'Applied', 'Interviewing', 'Offer', 'Rejected'].map(status => (
              <div key={status} className={`px-4 py-2.5 border ${STATUS_STYLE[status]} flex items-baseline gap-3`}>
                <span className="num font-chunk text-[20px] leading-none">{statusCounts[status] || 0}</span>
                <span className="font-mono text-[10px] tracking-caps uppercase">{status.toLowerCase()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent */}
      <div>
        <div className="flex items-baseline justify-between mb-6">
          <div>
            <p className="font-mono text-[10px] text-crimson-500 tracking-caps uppercase mb-2">№ 02</p>
            <h2 className="font-chunk text-[clamp(2rem,4vw,3rem)] tracking-tight text-ink-900">
              recent <span className="serif-accent text-crimson-500">activity</span>
            </h2>
          </div>
          <span className="font-mono text-[10px] text-ink-400 tracking-caps uppercase">{items.length} total</span>
        </div>

        {items.length === 0 ? (
          <div className="py-24 text-center border border-dashed border-ink-300">
            <p className="font-chunk text-[28px] tracking-tight text-ink-900 mb-2">nothing here yet</p>
            <p className="font-serif italic text-ink-500 text-[16px]">that's a feature. install the extension to begin.</p>
          </div>
        ) : (
          <div className="border-t border-ink-900">
            {recent.map(item => {
              const level = getMatchLevel(item.score)
              return (
                <Link
                  key={item.id}
                  href={`/dashboard/history/${item.id}`}
                  className="grid grid-cols-12 gap-4 items-center py-6 border-b border-ink-200 hover:bg-ink-50 transition-colors px-4 -mx-4 group"
                >
                  {/* Score */}
                  <div className="col-span-1 flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: `linear-gradient(135deg, ${level.gradientFrom}, ${level.gradientTo})` }}
                    />
                    <span className="num font-chunk text-[28px] leading-none tracking-tight text-ink-900">{item.score}</span>
                  </div>

                  {/* Title + company */}
                  <div className="col-span-6">
                    <h3 className="font-chunk text-[22px] tracking-tight text-ink-900 truncate">{item.job_title}</h3>
                    <p className="text-[13px] text-ink-500 mt-0.5">{item.site_name}</p>
                  </div>

                  {/* Level label */}
                  <div className="col-span-2 font-serif italic text-[14px] text-crimson-500">
                    {level.label.toLowerCase()}
                  </div>

                  {/* Date */}
                  <div className="col-span-1 font-mono text-[10px] text-ink-400 tracking-caps uppercase">
                    {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}
                  </div>

                  {/* Status */}
                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <span className={`font-mono text-[10px] tracking-caps uppercase px-3 py-1 border ${STATUS_STYLE[item.status] || STATUS_STYLE.Evaluating}`}>
                      {item.status.toLowerCase()}
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-ink-300 group-hover:text-ink-900 transition-colors" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
