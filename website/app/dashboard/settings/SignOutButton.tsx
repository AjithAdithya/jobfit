'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignOutButton() {
  const router = useRouter()
  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }
  return (
    <button
      onClick={handleSignOut}
      className="text-[15px] text-ink-500 hover:text-ink-900 transition-colors"
    >
      sign out →
    </button>
  )
}
