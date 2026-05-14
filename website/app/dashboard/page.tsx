import { createClient } from '@/lib/supabase/server'
import { getMatchLevel } from '@/lib/matchLevel'
import { computeCompleteness, completenessColor } from '@/lib/profileUtils'
import Link from 'next/link'
import { ArrowUpRight, Pencil, ArrowRight, Briefcase } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const STATUS_STYLE: Record<string, string> = {
  Evaluating:   'border-ink-300 text-ink-500',
  Applied:      'border-sky text-sky bg-sky/5',
  Interviewing: 'border-ink-900 text-ink-900 bg-ink-900/5',
  Offer:        'border-citrus text-ink-900 bg-citrus',
  Rejected:     'border-flare text-flare bg-flare/5',
}

async function getProfile(userId: string, supabase: ReturnType<typeof createClient>) {
  const { data } = await supabase.from('user_profiles').select('*').eq('user_id', userId).single()
  return data
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

async function RecommendedJobsTeaser({
  userId,
  supabase,
}: {
  userId: string
  supabase: ReturnType<typeof createClient>
}) {
  const { data: topJobs } = await supabase.rpc('list_user_jobs', {
    p_user_id: userId,
    p_location_type: null,
    p_score_floor: 0,
    p_role_family: null,
    p_source: null,
    p_max_age_days: 35,
    p_include_hidden: false,
    p_include_saved: null,
    p_limit: 3,
    p_offset: 0,
  })

  const jobs = topJobs ?? []

  return (
    <div className="mb-10 lg:mb-12">
      <div className="flex items-baseline justify-between mb-4 gap-4">
        <div>
          <p className="font-mono text-[10px] text-crimson-500 tracking-caps uppercase mb-2">№ 02</p>
          <h2 className="font-chunk text-[clamp(1.75rem,5vw,3rem)] tracking-tight text-ink-900">
            recommended <span className="serif-accent text-crimson-500">jobs</span>
          </h2>
        </div>
        <Link
          href="/dashboard/jobs"
          className="font-mono text-[10px] text-ink-500 tracking-caps uppercase hover:text-ink-900 transition-colors shrink-0"
        >
          view all →
        </Link>
      </div>

      {jobs.length === 0 ? (
        <Link href="/dashboard/jobs/preferences" className="block border border-dashed border-ink-200 p-8 hover:border-ink-900 transition-colors group">
          <div className="flex items-center gap-4">
            <Briefcase className="w-8 h-8 text-ink-300 group-hover:text-ink-900 transition-colors" />
            <div>
              <p className="font-chunk text-[18px] text-ink-900 mb-1">set up your job feed</p>
              <p className="font-serif italic text-[13px] text-ink-500">tell us your target roles — we score every posting nightly.</p>
            </div>
            <ArrowRight className="w-5 h-5 text-ink-300 group-hover:text-ink-900 transition-colors ml-auto shrink-0" />
          </div>
        </Link>
      ) : (
        <div className="space-y-2">
          {jobs.map((job: any) => {
            const level = getMatchLevel(job.score)
            return (
              <Link
                key={job.job_id}
                href={`/dashboard/jobs/${job.job_id}`}
                className="flex items-center gap-4 border border-ink-200 hover:border-ink-900 transition-colors p-4 sm:p-5 group"
              >
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: level.hex }} />
                  <span className="font-mono text-[10px] text-ink-500 num">{job.score}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-chunk text-[16px] sm:text-[18px] tracking-tight text-ink-900 group-hover:text-crimson-500 transition-colors truncate">
                    {job.job_title}
                  </p>
                  <p className="font-mono text-[11px] text-ink-500">{job.company}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-ink-300 group-hover:text-ink-900 transition-colors shrink-0" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ items, avgScore, statusCounts, resumeCount }, profile] = await Promise.all([
    getStats(user.id, supabase),
    getProfile(user.id, supabase),
  ])
  const recent = items.slice(0, 10)
  const name = user.user_metadata?.full_name?.split(' ')[0] || 'friend'
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined
  const profileCompleteness = profile ? computeCompleteness(profile) : 0
  const profileBarColor = completenessColor(profileCompleteness)

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">

      {/* Header */}
      <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 lg:items-end mb-10 lg:mb-16">
        <div className="lg:col-span-8">
          <p className="font-mono text-[11px] text-crimson-500 tracking-caps uppercase mb-4">№ 01 — dashboard</p>
          <h1 className="font-chunk text-[clamp(2.5rem,9vw,6rem)] leading-[0.98] tracking-tightest text-ink-900 break-words">
            hey, <span className="serif-accent text-crimson-500">{name}</span>.
          </h1>
          <p className="mt-4 text-[15px] sm:text-[16px] text-ink-500 italic font-serif">here's your job search, at a glance.</p>
        </div>
        <div className="lg:col-span-4 flex items-center justify-start lg:justify-end gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-crimson-500 animate-pulse" />
          <span className="font-mono text-[10px] text-ink-500 tracking-caps uppercase">synced from extension</span>
        </div>
      </div>

      {/* Stats — editorial */}
      <div className="grid grid-cols-2 md:grid-cols-4 border-t border-l border-ink-900 mb-10 lg:mb-12">
        {[
          { num: '01', value: String(items.length).padStart(2, '0'), label: 'jobs analyzed' },
          { num: '02', value: String(avgScore).padStart(2, '0'), label: 'avg match', suffix: '/100' },
          { num: '03', value: String(statusCounts.Interviewing || 0).padStart(2, '0'), label: 'interviewing' },
          { num: '04', value: String(resumeCount).padStart(2, '0'), label: 'resumes in vault' },
        ].map(stat => (
          <div key={stat.num} className="border-r border-b border-ink-900 p-5 sm:p-6 lg:p-8 bg-cream">
            <p className="font-mono text-[9px] sm:text-[10px] text-ink-400 tracking-caps uppercase mb-3 sm:mb-6">№ {stat.num}</p>
            <div className="flex items-baseline gap-1">
              <span className="font-chunk text-[clamp(2rem,8vw,5rem)] leading-none tracking-tightest text-ink-900">{stat.value}</span>
              {stat.suffix && <span className="num text-[12px] sm:text-[16px] text-ink-400">{stat.suffix}</span>}
            </div>
            <p className="font-mono text-[9px] sm:text-[10px] text-ink-500 tracking-caps uppercase mt-3 sm:mt-4">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Profile card */}
      <Link href="/dashboard/profile" className="block mb-10 lg:mb-12 group">
        <div className="border border-ink-200 hover:border-ink-900 transition-colors p-5 sm:p-6 lg:p-8 flex items-center gap-4 sm:gap-6">
          {/* Avatar */}
          <div className="shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt="profile" className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border border-ink-200" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-ink-900 text-cream flex items-center justify-center font-chunk text-lg sm:text-xl">
                {(user.email ?? '?')[0].toUpperCase()}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="font-mono text-[10px] text-ink-400 tracking-caps uppercase">candidate profile</p>
              <span className="font-mono text-[10px] text-ink-500 num">{profileCompleteness}%</span>
            </div>
            <p className="font-chunk text-[18px] sm:text-[22px] tracking-tight text-ink-900 leading-tight mb-3 truncate">
              {profile?.headline ?? (profile ? 'add a headline' : 'complete your profile')}
            </p>
            <div className="h-1 bg-ink-100 w-full">
              <div
                className={`h-full ${profileBarColor} transition-all`}
                style={{ width: `${profileCompleteness}%` }}
              />
            </div>
            {profileCompleteness < 80 && (
              <p className="font-mono text-[10px] text-ink-400 tracking-caps uppercase mt-2">
                {profileCompleteness < 40 ? 'add your details to improve tailoring accuracy' : 'almost there — a few more fields'}
              </p>
            )}
          </div>

          <ArrowRight className="w-5 h-5 text-ink-300 group-hover:text-ink-900 transition-colors shrink-0 hidden sm:block" />
        </div>
      </Link>

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

      {/* Recommended jobs teaser */}
      <RecommendedJobsTeaser userId={user.id} supabase={supabase} />

      {/* Recent */}
      <div>
        <div className="flex items-baseline justify-between mb-6 gap-4">
          <div>
            <p className="font-mono text-[10px] text-crimson-500 tracking-caps uppercase mb-2">№ 03</p>
            <h2 className="font-chunk text-[clamp(1.75rem,5vw,3rem)] tracking-tight text-ink-900">
              recent <span className="serif-accent text-crimson-500">activity</span>
            </h2>
          </div>
          <span className="font-mono text-[10px] text-ink-400 tracking-caps uppercase shrink-0">{items.length} total</span>
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
                  className="block md:grid md:grid-cols-12 md:gap-4 md:items-center py-5 md:py-6 border-b border-ink-200 hover:bg-ink-50 transition-colors px-4 -mx-4 group"
                >
                  {/* Mobile: stacked card. Desktop: 12-col grid */}

                  {/* Top row on mobile: score + status */}
                  <div className="md:col-span-1 flex items-center gap-2 md:gap-2 mb-2 md:mb-0">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: `linear-gradient(135deg, ${level.gradientFrom}, ${level.gradientTo})` }}
                    />
                    <span className="num font-chunk text-[24px] md:text-[28px] leading-none tracking-tight text-ink-900">{item.score}</span>
                    <span className="md:hidden font-serif italic text-[12px] text-crimson-500 ml-2">
                      {level.label.toLowerCase()}
                    </span>
                    <span className="md:hidden font-mono text-[9px] text-ink-400 tracking-caps uppercase ml-auto">
                      {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}
                    </span>
                  </div>

                  {/* Title + company */}
                  <div className="md:col-span-6 mb-3 md:mb-0">
                    <h3 className="font-chunk text-[18px] md:text-[22px] tracking-tight text-ink-900 truncate">{item.job_title}</h3>
                    <p className="text-[12px] md:text-[13px] text-ink-500 mt-0.5 truncate">{item.site_name}</p>
                  </div>

                  {/* Level label — desktop only */}
                  <div className="hidden md:block md:col-span-2 font-serif italic text-[14px] text-crimson-500">
                    {level.label.toLowerCase()}
                  </div>

                  {/* Date — desktop only */}
                  <div className="hidden md:block md:col-span-1 font-mono text-[10px] text-ink-400 tracking-caps uppercase">
                    {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}
                  </div>

                  {/* Status badges */}
                  <div className="md:col-span-2 flex items-center md:justify-end gap-2 flex-wrap">
                    {item.generated_resume && (
                      <span
                        title="Has tailored resume — click row to open and edit"
                        className="inline-flex items-center gap-1 px-2 py-1 bg-citrus/30 text-ink-900 font-mono text-[9px] tracking-caps uppercase rounded-sm"
                      >
                        <Pencil className="w-3 h-3" /> resume
                      </span>
                    )}
                    <span className={`font-mono text-[10px] tracking-caps uppercase px-2 sm:px-3 py-1 border ${STATUS_STYLE[item.status] || STATUS_STYLE.Evaluating}`}>
                      {item.status.toLowerCase()}
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-ink-300 group-hover:text-ink-900 transition-colors hidden md:block" />
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
