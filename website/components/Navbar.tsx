'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Menu, X } from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'

const NAV_LINKS = [
  { href: '/features', label: 'features', num: '01' },
  { href: '/how-it-works', label: 'how it works', num: '02' },
  { href: '/privacy', label: 'privacy', num: '03' },
]

function Monogram() {
  return (
    <div className="relative w-9 h-9 rounded-full border border-ink-900 flex items-center justify-center">
      <span className="font-chunk text-[15px] leading-none text-ink-900 tracking-tighter">JF</span>
      <span className="absolute -top-0.5 -right-0.5 text-[10px] text-crimson-500">✦</span>
    </div>
  )
}

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

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

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
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
            <span className="font-chunk text-lg tracking-tight text-ink-900 hidden sm:block">
              jobfit
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`group flex items-baseline gap-2 text-[15px] transition-colors ${
                  pathname === link.href ? 'text-ink-900' : 'text-ink-500 hover:text-ink-900'
                }`}
              >
                <span className="font-mono text-[10px] text-ink-400 tracking-caps">№{link.num}</span>
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-6">
            {user ? (
              <>
                <Link href="/dashboard" className="text-[15px] text-ink-900 hover:text-crimson-500 transition-colors underline decoration-1 underline-offset-4">
                  dashboard
                </Link>
                <button onClick={handleSignOut} className="text-[15px] text-ink-500 hover:text-ink-900 transition-colors">
                  sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-[15px] text-ink-500 hover:text-ink-900 transition-colors">
                  sign in
                </Link>
                <a
                  href="https://chrome.google.com/webstore"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-ink-900 text-cream font-medium text-[14px] rounded-md hover:bg-crimson-500 transition-colors"
                >
                  add to chrome <span>→</span>
                </a>
              </>
            )}
          </div>

          {/* Mobile menu */}
          <button className="md:hidden p-2 text-ink-900" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-cream border-b border-ink-200 px-6 py-4 space-y-1">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="flex items-baseline gap-3 py-3 text-[15px] text-ink-900"
            >
              <span className="font-mono text-[10px] text-ink-400 tracking-caps">№{link.num}</span>
              {link.label}
            </Link>
          ))}
          <div className="pt-3 mt-3 border-t border-ink-200 flex flex-col gap-2">
            {user ? (
              <>
                <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="py-3 text-[15px] text-ink-900">dashboard</Link>
                <button onClick={handleSignOut} className="py-3 text-left text-[15px] text-ink-500">sign out</button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMenuOpen(false)} className="py-3 text-[15px] text-ink-900">sign in</Link>
                <a href="https://chrome.google.com/webstore" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-ink-900 text-cream rounded-md">add to chrome →</a>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
