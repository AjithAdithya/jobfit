import Link from 'next/link'
import BetaButton from './BetaButton'

export default function Footer() {
  return (
    <footer className="border-t border-ink-900 bg-cream">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-16">

        {/* Big wordmark */}
        <div className="pb-16 border-b border-ink-200">
          <p className="font-mono text-[10px] text-ink-500 tracking-caps uppercase mb-4">№ 00 — you've reached the bottom</p>
          <h2 className="font-chunk text-[clamp(3rem,12vw,9rem)] leading-none tracking-tightest text-ink-900">
            job<span className="serif-accent text-crimson-500">fit</span>
          </h2>
        </div>

        {/* Link rows */}
        <div className="grid md:grid-cols-4 gap-10 py-12">
          <div>
            <p className="font-mono text-[10px] text-ink-400 tracking-caps uppercase mb-4">product</p>
            <ul className="space-y-2">
              {[
                { label: 'features', href: '/features' },
                { label: 'how it works', href: '/how-it-works' },
                { label: 'privacy', href: '/privacy' },
              ].map(link => (
                <li key={link.label}>
                  <Link href={link.href} className="text-[15px] text-ink-900 hover:text-crimson-500 transition-colors underline decoration-1 underline-offset-[0.2em]">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <BetaButton className="text-[15px] text-ink-900 hover:text-crimson-500 transition-colors underline decoration-1 underline-offset-[0.2em]">
                  join the beta
                </BetaButton>
              </li>
            </ul>
          </div>

          <div>
            <p className="font-mono text-[10px] text-ink-400 tracking-caps uppercase mb-4">account</p>
            <ul className="space-y-2">
              <li><Link href="/login" className="text-[15px] text-ink-900 hover:text-crimson-500 transition-colors underline decoration-1 underline-offset-[0.2em]">sign in</Link></li>
              <li><Link href="/dashboard" className="text-[15px] text-ink-900 hover:text-crimson-500 transition-colors underline decoration-1 underline-offset-[0.2em]">dashboard</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <p className="font-mono text-[10px] text-ink-400 tracking-caps uppercase mb-4">principle</p>
            <p className="font-serif italic text-[1.5rem] leading-snug text-ink-900 max-w-md">
              "your keys, your data, your <span className="text-crimson-500">control</span>."
            </p>
            <p className="text-[13px] text-ink-500 mt-2">Bring your own Anthropic and Voyage AI keys. We never see or store them.</p>
          </div>
        </div>

        {/* Baseline */}
        <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-ink-200">
          <p className="font-mono text-[10px] text-ink-400 tracking-caps uppercase">
            © {new Date().getFullYear()} — built from scratch · hosted on vercel · take care out there.
          </p>
          <p className="font-mono text-[10px] text-ink-400 tracking-caps uppercase">
            v0.1 · mit license
          </p>
        </div>
      </div>
    </footer>
  )
}
