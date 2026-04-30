import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ProfileForm from '@/components/ProfileForm'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ProfilePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const avatarUrl = user.user_metadata?.avatar_url as string | undefined
  const fullName = user.user_metadata?.full_name as string | undefined
  const initial = (user.email ?? '?')[0].toUpperCase()

  return (
    <div className="max-w-[720px] mx-auto px-4 sm:px-6 lg:px-10">

      <Link href="/dashboard" className="inline-flex items-center gap-2 text-[14px] text-ink-500 hover:text-ink-900 transition-colors mb-12">
        <ArrowLeft className="w-4 h-4" /> back to dashboard
      </Link>

      {/* Header */}
      <div className="mb-12">
        <p className="font-mono text-[11px] text-crimson-500 tracking-caps uppercase mb-4">candidate profile</p>
        <div className="flex items-center gap-5 mb-6">
          {avatarUrl ? (
            <img src={avatarUrl} alt="profile" className="w-16 h-16 rounded-full object-cover border border-ink-200" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-ink-900 text-cream flex items-center justify-center font-chunk text-2xl shrink-0">
              {initial}
            </div>
          )}
          <div>
            <h1 className="font-chunk text-[clamp(2rem,5vw,3rem)] leading-none tracking-tightest text-ink-900">
              {fullName ?? user.email}
            </h1>
            <p className="text-[14px] text-ink-500 mt-1">{user.email}</p>
          </div>
        </div>
        <p className="text-[15px] text-ink-500 italic font-serif">
          This information is used to personalise your resume tailoring and match scoring. It stays private.
        </p>
      </div>

      <ProfileForm initial={profile} userId={user.id} />

    </div>
  )
}
