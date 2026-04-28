'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'openid email profile',
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-6">
      <div className="w-full max-w-md">

        {/* Monogram */}
        <Link href="/" className="inline-flex items-center gap-3 mb-16">
          <div className="relative w-10 h-10 rounded-full border border-ink-900 flex items-center justify-center">
            <span className="font-chunk text-[16px] leading-none tracking-tighter">JF</span>
            <span className="absolute -top-0.5 -right-0.5 text-[11px] text-crimson-500">✦</span>
          </div>
          <span className="font-chunk text-[22px] tracking-tight text-ink-900">Job</span><span className="serif-accent text-crimson-500 text-[22px]">fit</span>
        </Link>

        {/* Heading */}
        <p className="font-mono text-[11px] text-crimson-500 tracking-caps uppercase mb-4">№ 01 — sign in</p>
        <h1 className="font-chunk text-[clamp(2.5rem,6vw,4rem)] leading-[0.98] tracking-tight text-ink-900 mb-6">
          pick up <span className="serif-accent text-crimson-500">where</span><br />
          you left off.
        </h1>
        <p className="text-[16px] text-ink-600 leading-relaxed mb-12 max-w-sm">
          Access your dashboard, match history, and resume vault — same account as the extension.
        </p>

        {/* Google button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-ink-900 text-cream font-medium text-[15px] rounded-md hover:bg-crimson-500 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#ffffff"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#ffffff" opacity="0.6"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#ffffff" opacity="0.7"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#ffffff" opacity="0.8"/>
            </svg>
          )}
          {loading ? 'signing in…' : 'continue with google'}
        </button>

        {error && (
          <div className="mt-4 p-4 border border-flare text-flare text-[13px] rounded-sm">
            {error}
          </div>
        )}

        <div className="mt-8 flex items-center gap-2 text-[12px] text-ink-500">
          <span className="text-crimson-500 font-mono">✦</span>
          your API keys stay in your browser — never on our servers.
        </div>

        <hr className="my-10 border-ink-200" />

        <p className="font-mono text-[10px] text-ink-400 tracking-caps uppercase">
          don't have the extension yet?{' '}
          <a href="/" className="text-crimson-500 hover:underline">
            join the beta →
          </a>
        </p>
      </div>
    </div>
  )
}
