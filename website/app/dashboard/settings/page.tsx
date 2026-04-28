import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SignOutButton from './SignOutButton'

export default async function SettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { count: jobCount } = await supabase
    .from('analysis_history')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const { count: resumeCount } = await supabase
    .from('resume_chunkies')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const avatarUrl = user.user_metadata?.avatar_url as string | undefined
  const fullName = user.user_metadata?.full_name as string | undefined
  const initial = (user.email ?? '?')[0].toUpperCase()

  return (
    <div className="max-w-2xl mx-auto px-6 space-y-8">
      <h1 className="font-chunk text-3xl text-ink-900">settings</h1>

      {/* Profile */}
      <section className="border border-ink-200 rounded-xl p-6 flex items-center gap-5">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="profile"
            className="w-14 h-14 rounded-full object-cover shrink-0"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-ink-900 text-cream flex items-center justify-center font-chunk text-xl shrink-0">
            {initial}
          </div>
        )}
        <div>
          {fullName && <p className="text-[16px] text-ink-900 font-medium">{fullName}</p>}
          <p className="text-[14px] text-ink-500 mt-0.5">{user.email}</p>
        </div>
      </section>

      {/* Data summary */}
      <section className="border border-ink-200 rounded-xl p-6 space-y-4">
        <h2 className="text-[13px] font-medium text-ink-400 uppercase tracking-widest">Your data</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-ink-50 rounded-lg p-4">
            <p className="font-chunk text-3xl text-ink-900">{jobCount ?? 0}</p>
            <p className="text-[13px] text-ink-500 mt-1">jobs analyzed</p>
          </div>
          <div className="bg-ink-50 rounded-lg p-4">
            <p className="font-chunk text-3xl text-ink-900">{resumeCount ?? 0}</p>
            <p className="text-[13px] text-ink-500 mt-1">resume chunks stored</p>
          </div>
        </div>
      </section>

      {/* More sections — usage analytics, delete account — coming soon */}
      <section className="border border-dashed border-ink-300 rounded-xl p-8 text-center text-ink-400 text-[15px]">
        Usage analytics and data deletion coming soon.
      </section>

      {/* Sign out */}
      <section className="border border-ink-200 rounded-xl p-6">
        <h2 className="text-[13px] font-medium text-ink-400 uppercase tracking-widest mb-4">Account</h2>
        <SignOutButton />
      </section>
    </div>
  )
}
