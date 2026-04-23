import Link from 'next/link'
import { Zap, Github, Shield, Heart } from 'lucide-react'

const LINKS = {
  Product: [
    { label: 'Features', href: '/features' },
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'Add to Chrome', href: 'https://chrome.google.com/webstore' },
  ],
  Company: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Dashboard', href: '/dashboard' },
  ],
}

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/60 bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-black text-white">JobFit<span className="text-blue-400"> AI</span></span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              AI-powered resume tailoring for serious job seekers. Your data stays yours.
            </p>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full w-fit">
              <Shield className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Privacy First</span>
            </div>
          </div>

          {/* Links */}
          {Object.entries(LINKS).map(([section, items]) => (
            <div key={section}>
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">{section}</h4>
              <ul className="space-y-3">
                {items.map(item => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-slate-500 hover:text-white transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* BYOK callout */}
          <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-3xl space-y-2">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">BYOK — Bring Your Own Keys</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Use your own Anthropic and Voyage AI API keys. We never see or store them.
            </p>
            <Link href="/privacy" className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors">
              Learn more →
            </Link>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-600">© {new Date().getFullYear()} JobFit AI. All rights reserved.</p>
          <p className="text-xs text-slate-600 flex items-center gap-1.5">
            Built with <Heart className="w-3 h-3 text-rose-500" /> for job seekers
          </p>
        </div>
      </div>
    </footer>
  )
}
