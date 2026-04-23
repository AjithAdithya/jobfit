import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import {
  Target, Zap, FileText, Palette, History, Shield,
  CheckCircle2, ChevronRight, Star, Download, Brain,
  Database, Lock, Key, Chrome, ArrowRight, Sparkles
} from 'lucide-react'

/* ---------- Extension UI Mockup ---------- */
function ExtensionMockup() {
  return (
    <div className="relative w-[360px] bg-slate-950 rounded-[2rem] border border-slate-800 shadow-2xl overflow-hidden font-sans select-none" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-black text-white">JobFit<span className="text-blue-400"> AI</span></span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-bold text-slate-500">LIVE</span>
        </div>
      </div>

      {/* Job info banner */}
      <div className="mx-4 mt-4 px-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Analyzing</p>
        <p className="text-sm font-black text-white">Senior Frontend Engineer</p>
        <p className="text-[11px] text-slate-500 font-medium">Stripe · stripe.com</p>
      </div>

      {/* Match card */}
      <div className="mx-4 mt-3 p-5 bg-gradient-to-br from-emerald-600/10 to-cyan-600/5 border border-emerald-500/20 rounded-[1.5rem] relative overflow-hidden">
        <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-emerald-400 rounded-full blur-[60px] opacity-10" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Job Compatibility</p>
            <h2 className="text-2xl font-black text-emerald-300">Excellent Match</h2>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Highly competitive candidate</p>
          </div>
          {/* Mini score circle */}
          <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="26" stroke="currentColor" strokeWidth="5" fill="transparent" className="text-slate-800" />
              <circle cx="32" cy="32" r="26" stroke="url(#g1)" strokeWidth="5" strokeDasharray="163.4" strokeDashoffset="24.5" strokeLinecap="round" fill="transparent" />
              <defs>
                <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-black text-white leading-none">85</span>
              <span className="text-[7px] font-bold text-slate-500 uppercase tracking-tighter">Fit %</span>
            </div>
          </div>
        </div>
      </div>

      {/* Strengths section */}
      <div className="mx-4 mt-3 bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Matching Strengths</span>
            <span className="text-lg font-black text-emerald-400 leading-none">6</span>
            <span className="text-slate-600 text-xs">/</span>
            <span className="text-sm font-black text-slate-500 leading-none">9</span>
          </div>
        </div>
        <div className="px-4 pb-3 space-y-2">
          {['React & TypeScript expertise', 'Performance optimization experience', '5+ years frontend development'].map((s, i) => (
            <div key={i} className="flex items-start gap-2.5 p-2.5 bg-slate-950/50 rounded-xl border border-slate-800/50">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
              <p className="text-[11px] text-slate-300 font-medium">{s}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Keywords */}
      <div className="mx-4 mt-3 mb-4 bg-slate-900/50 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Target Keywords</span>
          <span className="text-[10px] text-slate-500 font-bold">4/8 selected</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['TypeScript', 'React', 'GraphQL', 'CI/CD'].map(k => (
            <span key={k} className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 border border-amber-500/50 text-amber-300">{k}</span>
          ))}
          {['Node.js', 'AWS', 'Docker'].map(k => (
            <span key={k} className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-950 border border-slate-700 text-slate-500">{k}</span>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="mx-4 mb-4 grid grid-cols-2 gap-2">
        <button className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl text-[11px] font-black text-white">
          <FileText className="w-3.5 h-3.5" /> Generate Resume
        </button>
        <button className="flex items-center justify-center gap-2 p-3 bg-slate-800 border border-slate-700 rounded-2xl text-[11px] font-black text-slate-300">
          <Download className="w-3.5 h-3.5" /> Download DOCX
        </button>
      </div>
    </div>
  )
}

/* ---------- Feature Card ---------- */
function FeatureCard({ icon: Icon, title, description, accent }: {
  icon: React.ElementType; title: string; description: string; accent: string
}) {
  return (
    <div className={`p-6 bg-slate-900/50 border border-slate-800 rounded-3xl hover:border-slate-700 transition-all hover:-translate-y-1 group`}>
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 ${accent}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <h3 className="font-black text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
    </div>
  )
}

/* ---------- Step ---------- */
function Step({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex gap-5">
      <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center font-black text-white text-sm shadow-lg shadow-blue-500/20">
        {number}
      </div>
      <div>
        <h3 className="font-black text-white mb-1">{title}</h3>
        <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

/* ---------- Stat ---------- */
function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-4xl font-black text-white mb-1">{value}</div>
      <div className="text-xs text-slate-500 font-medium uppercase tracking-widest">{label}</div>
    </div>
  )
}

/* ---------- Page ---------- */
export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        {/* Background glows */}
        <div className="absolute top-20 left-1/4 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-[400px] h-[400px] bg-purple-600/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left — copy */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full">
                <Chrome className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs font-black text-blue-400 uppercase tracking-widest">Chrome Extension</span>
              </div>

              <h1 className="text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight">
                Land more<br />
                <span className="gradient-text">interviews</span><br />
                with AI tailoring
              </h1>

              <p className="text-lg text-slate-400 leading-relaxed max-w-lg">
                JobFit AI analyzes any job description, scores your resume fit across 10 levels, identifies gaps, and generates a perfectly tailored resume — in seconds.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="https://chrome.google.com/webstore"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 transition-all hover:-translate-y-0.5"
                >
                  <Chrome className="w-5 h-5" />
                  Add to Chrome — Free
                  <ArrowRight className="w-4 h-4" />
                </a>
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-black rounded-2xl transition-all"
                >
                  Sign in to Dashboard
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-4 pt-2">
                {[
                  { icon: Key, text: 'Bring Your Own Keys' },
                  { icon: Shield, text: 'Your data stays yours' },
                  { icon: Lock, text: 'No key storage' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-xs text-slate-500">
                    <Icon className="w-3.5 h-3.5 text-emerald-400" />
                    {text}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Extension Mockup */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative animate-float">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-[2rem] blur-2xl scale-110" />
                <ExtensionMockup />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-16 border-y border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <Stat value="10" label="Match levels" />
            <Stat value="5s" label="Analysis time" />
            <Stat value="100%" label="Private by design" />
            <Stat value="0" label="Keys stored by us" />
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <p className="text-xs font-black text-blue-400 uppercase tracking-widest">Everything you need</p>
            <h2 className="text-4xl font-black text-white">Built for serious job seekers</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Every feature is designed around one goal: getting your resume in front of hiring managers.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard icon={Target} accent="bg-blue-600" title="10-Level Match Scoring" description="From 'No Match' to 'Elite Match' — know exactly where you stand before you apply." />
            <FeatureCard icon={Zap} accent="bg-amber-600" title="Gap Analysis" description="See exactly what skills and keywords are missing and which ones to address first." />
            <FeatureCard icon={FileText} accent="bg-emerald-600" title="AI Resume Generation" description="Claude AI rewrites your resume to emphasize the right experience for each specific role." />
            <FeatureCard icon={Palette} accent="bg-purple-600" title="Style Presets" description="Describe your style or upload a template PDF — get matching fonts, spacing, and layout." />
            <FeatureCard icon={History} accent="bg-cyan-600" title="Activity Log" description="Track every job you've analyzed with status updates — Evaluating, Applied, Interviewing, Offer." />
            <FeatureCard icon={Shield} accent="bg-rose-600" title="Privacy First" description="Bring your own Anthropic and Voyage keys. We never see or store your API credentials." />
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-24 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div className="space-y-4">
              <p className="text-xs font-black text-purple-400 uppercase tracking-widest">Simple workflow</p>
              <h2 className="text-4xl font-black text-white">From job post to tailored resume in 3 steps</h2>
              <p className="text-slate-400">Open any job posting, let JobFit do the analysis, and walk away with a resume built for that role.</p>

              <div className="pt-6 space-y-8">
                <Step number="1" title="Upload your base resume" description="Upload your master resume PDF once. JobFit chunks and embeds it using Voyage AI for semantic matching." />
                <Step number="2" title="Open any job post" description="Browse to any job description. Click JobFit in your toolbar to start the AI analysis instantly." />
                <Step number="3" title="Generate and download" description="Review your match score, select gaps to address, and generate a tailored resume ready for download as DOCX." />
              </div>

              <div className="pt-4">
                <Link href="/how-it-works" className="inline-flex items-center gap-2 text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors">
                  See the full architecture <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Architecture mini-diagram */}
            <div className="space-y-3">
              {[
                { icon: Database, label: 'Your Resume', desc: 'PDF → chunks → Voyage embeddings → Supabase pgvector', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
                { icon: Brain, label: 'AI Analysis', desc: 'Job description → Claude Haiku → match score, gaps, keywords', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
                { icon: FileText, label: 'Resume Generation', desc: 'Claude Sonnet → tailored HTML → DOCX → A4 enforced', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                { icon: Lock, label: 'Your Data', desc: 'Stored in your Supabase project — fully under your control', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
              ].map(({ icon: Icon, label, desc, color, bg }) => (
                <div key={label} className={`flex items-start gap-4 p-4 border ${bg} rounded-2xl`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
                    <Icon className={`w-4.5 h-4.5 ${color}`} />
                  </div>
                  <div>
                    <p className={`text-sm font-black ${color}`}>{label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Privacy highlight ── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-10 bg-gradient-to-br from-emerald-600/5 to-blue-600/5 border border-emerald-500/10 rounded-[2.5rem] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
            <div className="relative z-10 grid md:grid-cols-2 gap-10 items-center">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">Privacy First</span>
                </div>
                <h2 className="text-3xl font-black text-white">Your keys. Your data. Your control.</h2>
                <p className="text-slate-400 leading-relaxed">
                  JobFit uses a Bring Your Own Keys model. You provide your Anthropic and Voyage AI API keys — they're stored only in your browser's local storage and never transmitted to our servers.
                </p>
                <Link href="/privacy" className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600/80 hover:bg-emerald-600 text-white font-black rounded-2xl transition-all text-sm">
                  Read our privacy policy <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Key, title: 'BYOK', desc: 'API keys stored in your browser only' },
                  { icon: Database, title: 'Your Supabase', desc: 'Data in your own project' },
                  { icon: Lock, title: 'No telemetry', desc: 'Zero usage tracking' },
                  { icon: Shield, title: 'Delete anytime', desc: 'One click to wipe all data' },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
                    <Icon className="w-5 h-5 text-emerald-400 mb-2" />
                    <p className="text-sm font-black text-white">{title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 border-t border-slate-800/60">
        <div className="max-w-3xl mx-auto px-4 text-center space-y-8">
          <h2 className="text-4xl font-black text-white">Ready to land more interviews?</h2>
          <p className="text-slate-400 text-lg">Install in seconds. No account required to start. Bring your API keys and go.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://chrome.google.com/webstore"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 transition-all hover:-translate-y-0.5"
            >
              <Chrome className="w-5 h-5" /> Add to Chrome — Free
            </a>
            <Link href="/features" className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-black rounded-2xl transition-all">
              Explore features
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
