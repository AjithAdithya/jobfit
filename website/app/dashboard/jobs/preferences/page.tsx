import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PreferencesForm from './PreferencesForm'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function JobPreferencesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: prefs }, { data: resumes }] = await Promise.all([
    supabase.from('user_job_preferences').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('resumes').select('id, filename').eq('user_id', user.id).order('created_at', { ascending: false }),
  ])

  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-10 py-10 lg:py-16">
      <p className="font-mono text-[11px] text-crimson-500 tracking-caps uppercase mb-4">№ 05 — job preferences</p>
      <h1 className="font-chunk text-[clamp(2rem,7vw,4.5rem)] leading-[0.98] tracking-tightest text-ink-900 mb-4">
        job search<br /><span className="serif-accent text-crimson-500">preferences.</span>
      </h1>
      <p className="font-serif italic text-[15px] text-ink-500 mb-10 lg:mb-14">
        tell us what you're looking for. we'll match every new posting against your resume overnight.
      </p>

      <PreferencesForm
        initial={prefs ?? {}}
        resumes={resumes ?? []}
      />
    </div>
  )
}
