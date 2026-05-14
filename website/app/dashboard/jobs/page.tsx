import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import FilterBar from './FilterBar'
import JobsFeedClient from './JobsFeedClient'
import JobsLoading from './loading'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  searchParams: Record<string, string | undefined>
}

async function JobsFeed({ searchParams }: PageProps) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: prefs } = await supabase
    .from('user_job_preferences')
    .select('active_resume_id')
    .eq('user_id', user.id)
    .maybeSingle()

  const hasPrefs = Boolean(prefs?.active_resume_id)

  const { data: jobs } = await supabase.rpc('list_user_jobs', {
    p_user_id:        user.id,
    p_location_type:  searchParams.loc ?? null,
    p_score_floor:    parseInt(searchParams.score ?? '0', 10) || 0,
    p_role_family:    searchParams.role ?? null,
    p_source:         searchParams.source ?? null,
    p_max_age_days:   parseInt(searchParams.age ?? '35', 10) || 35,
    p_include_hidden: false,
    p_include_saved:  searchParams.saved === 'true' ? true : null,
    p_limit:          25,
    p_offset:         0,
  })

  const cleanSearchParams: Record<string, string> = {}
  for (const [k, v] of Object.entries(searchParams)) {
    if (v) cleanSearchParams[k] = v
  }

  return (
    <JobsFeedClient
      initialJobs={jobs ?? []}
      hasPrefs={hasPrefs}
      searchParams={cleanSearchParams}
    />
  )
}

export default async function JobsPage({ searchParams }: PageProps) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { count: totalJobs } = await supabase
    .from('job_scores')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('stale', false)

  return (
    <div>
      {/* Header */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 pt-10 pb-6 lg:pt-16 lg:pb-8">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <p className="font-mono text-[11px] text-crimson-500 tracking-caps uppercase mb-4">№ 02 — job feed</p>
            <h1 className="font-chunk text-[clamp(2rem,7vw,4.5rem)] leading-[0.98] tracking-tightest text-ink-900">
              your ranked<br /><span className="serif-accent text-crimson-500">jobs.</span>
            </h1>
            {totalJobs != null && totalJobs > 0 && (
              <p className="font-mono text-[11px] text-ink-500 mt-2">{totalJobs} jobs scored against your resume</p>
            )}
          </div>
          <Link
            href="/dashboard/jobs/preferences"
            className="px-4 py-2.5 border border-ink-200 font-mono text-[10px] tracking-caps uppercase text-ink-500 hover:border-ink-900 hover:text-ink-900 transition-colors self-end"
          >
            edit preferences
          </Link>
        </div>
      </div>

      <FilterBar />

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-6">
        <Suspense fallback={<JobsLoading />}>
          <JobsFeed searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  )
}
