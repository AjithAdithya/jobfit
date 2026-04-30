'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Menu, X, Settings, LogOut, User } from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import BetaSignupModal from './BetaSignupModal'

const MARKETING_NAV = [
  { href: '/features', label: 'features', num: '01' },
  { href: '/how-it-works', label: 'how it works', num: '02' },
  { href: '/privacy', label: 'privacy', num: '03' },
]

const APP_NAV = [
  { href: '/dashboard', label: 'dashboard', num: '01' },
  { href: '/dashboard/vault', label: 'vault', num: '02' },
]

function Monogram() {
  return (
    <div className="relative w-9 h-9 rounded-full border border-ink-900 flex items-center justify-center">
      <span className="font-chunk text-[15px] leading-none text-ink-900 tracking-tighter">JF</span>
      <span className="absolute -top-0.5 -right-0.5 text-[10px] text-crimson-500">✦</span>
    </div>
  )
}

function Avatar({ url, initial }: { url?: string; initial: string }) {
  if (url) {
    return (
      <img
        src={url}
        alt="profile"
        className="w-8 h-8 rounded-full object-cover"
        referrerPolicy="no-referrer"
      />
    )
  }
  return (
    <div className="w-8 h-8 rounded-full bg-ink-900 text-cream flex items-center justify-center font-chunk text-sm select-none">
      {initial}
    </div>
  )
}

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [betaOpen, setBetaOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    if (!profileOpen) return
    const handler = (e: MouseEvent) => {
      if (!profileRef.current?.contains(e.target as Node)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [profileOpen])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined
  const fullName = user?.user_metadata?.full_name as string | undefined
  const initial = (user?.email ?? '?')[0].toUpperCase()

  return (
    <>
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-160 ${scrolled ? 'border-b border-ink-200/60' : ''}`}
      style={{
        background: scrolled ? 'rgba(237, 233, 227, 0.72)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
      }}
    >
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <div className="flex items-center justify-between h-16">
          {/* Monogram */}
          <Link href="/" className="flex items-center gap-3 group">
            <Monogram />
            <span className="hidden sm:inline">
              <span className="font-chunk text-lg tracking-tight text-ink-900">Job</span><span className="serif-accent text-crimson-500 text-lg">fit</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-2">
            {(user ? APP_NAV : MARKETING_NAV).map(link => {
              const active = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href))
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-baseline gap-1.5 text-[15px] transition-colors px-3 py-1 rounded-full ${
                    active
                      ? 'bg-ink-900 text-cream'
                      : 'text-ink-500 hover:text-ink-900'
                  }`}
                >
                  <span className={`font-mono text-[10px] tracking-caps ${active ? 'text-ink-400' : 'text-ink-400'}`}>№{link.num}</span>
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(v => !v)}
                  className="flex items-center justify-center rounded-full ring-2 ring-transparent hover:ring-ink-300 transition-all"
                  aria-label="Profile menu"
                >
                  <Avatar url={avatarUrl} initial={initial} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-11 w-[min(14rem,calc(100vw-2rem))] bg-cream border border-ink-200 rounded-xl shadow-lg overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-ink-100">
                      {fullName && (
                        <p className="text-[13px] font-medium text-ink-900 truncate">{fullName}</p>
                      )}
                      <p className="text-[12px] text-ink-500 truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/dashboard/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-[14px] text-ink-700 hover:bg-ink-50 transition-colors"
                    >
                      <User className="w-3.5 h-3.5 text-ink-400" />
                      my profile
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-[14px] text-ink-700 hover:bg-ink-50 transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5 text-ink-400" />
                      settings
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[14px] text-ink-700 hover:bg-ink-50 transition-colors text-left border-t border-ink-100"
                    >
                      <LogOut className="w-3.5 h-3.5 text-ink-400" />
                      sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login" className="text-[15px] text-ink-500 hover:text-ink-900 transition-colors">
                  sign in
                </Link>
                <button
                  onClick={() => setBetaOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-ink-900 text-cream font-medium text-[14px] rounded-md hover:bg-crimson-500 transition-colors"
                >
                  join the beta <span>→</span>
                </button>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button className="md:hidden p-2 text-ink-900" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-cream border-b border-ink-200 px-6 py-4 space-y-1">
          {(user ? APP_NAV : MARKETING_NAV).map(link => {
            const active = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href))
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-baseline gap-3 py-2.5 px-3 rounded-full text-[15px] transition-colors ${active ? 'bg-ink-900 text-cream' : 'text-ink-900'}`}
              >
                <span className="font-mono text-[10px] tracking-caps text-ink-400">№{link.num}</span>
                {link.label}
              </Link>
            )
          })}
          <div className="pt-3 mt-3 border-t border-ink-200 flex flex-col gap-1">
            {user ? (
              <>
                <div className="flex items-center gap-3 py-3">
                  <Avatar url={avatarUrl} initial={initial} />
                  <div>
                    {fullName && <p className="text-[13px] font-medium text-ink-900">{fullName}</p>}
                    <p className="text-[12px] text-ink-500 truncate">{user.email}</p>
                  </div>
                </div>
                <Link
                  href="/dashboard/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 py-3 text-[15px] text-ink-700"
                >
                  <User className="w-4 h-4 text-ink-400" />
                  my profile
                </Link>
                <Link
                  href="/dashboard/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 py-3 text-[15px] text-ink-700"
                >
                  <Settings className="w-4 h-4 text-ink-400" />
                  settings
                </Link>
                <button onClick={handleSignOut} className="flex items-center gap-2.5 py-3 text-left text-[15px] text-ink-500">
                  <LogOut className="w-4 h-4 text-ink-400" />
                  sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMenuOpen(false)} className="py-3 text-[15px] text-ink-900">sign in</Link>
                <button onClick={() => { setBetaOpen(true); setMenuOpen(false); }} className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-ink-900 text-cream rounded-md">join the beta →</button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
    {betaOpen && <BetaSignupModal onClose={() => setBetaOpen(false)} />}
  </>
  )
}
