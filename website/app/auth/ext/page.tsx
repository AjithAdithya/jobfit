'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function ExtAuthPage() {
  const router = useRouter()

  useEffect(() => {
    const hash = window.location.hash.slice(1)
    const params = new URLSearchParams(hash)
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')

    if (!accessToken || !refreshToken) {
      router.replace('/dashboard')
      return
    }

    const supabase = createClient()
    supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        router.replace(error ? '/login' : '/dashboard')
      })
  }, [router])

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center gap-3 text-ink-500">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span className="font-mono text-[13px] tracking-tight">signing you in…</span>
    </div>
  )
}
