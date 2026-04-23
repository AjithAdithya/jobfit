import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Target, Zap, FileText, Palette, History, Shield, CheckCircle2, Sparkles, Download, Brain, ChevronRight } from 'lucide-react'
import Link from 'next/link'

const MATCH_LEVELS = [
  { score: '95+', label: 'Elite Match', color: 'text-cyan-300', bg: 'bg-cyan-500/10 border-cyan-500/20', bar: 'bg-cyan-400' },
  { score: '85+', label: 'Excellent Match', color: 'text-emerald-300', bg: 'bg-emerald-500/10 border-emerald-500/20', bar: 'bg-emerald-400' },
  { score: '75+', label: 'Great Match', color: 'text-green-300', bg: 'bg-green-500/10 border-green-500/20', bar: 'bg-green-400' },
  { score: '65+', label: 'Strong Fit', color: 'text-lime-300', bg: 'bg-lime-500/10 border-lime-500/20', bar: 'bg-lime-400' },
  { score: '55+', label: 'Decent Fit', color: 'text-yellow-300', bg: 'bg-yellow-500/10 border-yellow-500/20', bar: 'bg-yellow-400' },
  { score: '45+', label: 'Partial Match', color: 'text-amber-300', bg: 'bg-amber-500/10 border-amber-500/20', bar: 'bg-amber-400' },
  { score: '35+', label: 'Developing', color: 'text-orange-300', bg: 'bg-orange-500/10 border-orange-500/20', bar: 'bg-orange-400' },
  { score: '25+', label: 'Weak Fit', color: 'text-red-300', bg: 'bg-red-500/10 border-red-500/20', bar: 'bg-red-400' },
  { score: '10+', label: 'Long Shot', color: 'text-rose-300', bg: 'bg-rose-500/10 border-rose-500/20', bar: 'bg-rose-400' },
  { score: '0+', label: 'No Match', color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-700/30', bar: 'bg-slate-500' },
]

function SectionHeader({ label, title, description }: { label: string; title: string; description?: string }) {
  return (
    <div className="space-y-3 mb-12">
      <p className="text-xs font-black text-blue-400 uppercase tracking-widest">{label}</p>
      <h2 className="text-3xl font-black text-white">{title}</h2>
      {description && <p className="text-slate-400 max-w-2xl">{description}</p>}
    </div>
  )
}

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />

      <div className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center pt-12 pb-16 space-y-4">
            <p className="text-xs font-black text-purple-400 uppercase tracking-widest">Features</p>
            <h1 className="text-5xl font-black text-white">Every tool you need<br /><span className="gradient-text">to get the job</span></h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">From smart scoring to AI-tailored resumes, JobFit gives you the edge on every application.</p>
          </div>

          {/* ── 10 Match Levels ── */}
          <section className="py-16 border-t border-slate-800/60">
            <SectionHeader label="Scoring engine" title="10-Level compatibility scoring" description="Not just a number — a named level with actionable context. Know exactly how competitive you are before you apply." />
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {MATCH_LEVELS.map(lvl => (
                <div key={lvl.label} className={`p-4 border rounded-2xl ${lvl.bg}`}>
                  <div className={`text-lg font-black ${lvl.color} mb-1`}>{lvl.score}</div>
                  <div className={`text-sm font-black ${lvl.color}`}>{lvl.label}</div>
                  <div className="mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${lvl.bar} rounded-full`} style={{ width: `${parseInt(lvl.score) || 5}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Gap Analysis ── */}
          <section className="py-16 border-t border-slate-800/60">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <SectionHeader label="Gap analysis" title="See exactly what's missing" description="JobFit compares your resume against the job description and surfaces the specific skills, experience, and keywords you need to address." />
                <ul className="space-y-3">
                  {['Semantic matching via pgvector embeddings', 'Checkbox-based gap selection for your resume', 'Persistent selection saved to your history', 'Integrated into resume generation context'].map(item => (
                    <li key={item} className="flex items-center gap-3 text-sm text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              {/* Gap mockup */}
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-black text-blue-400 uppercase tracking-widest">Recommended Gaps</span>
                  <span className="text-xs text-slate-500">2/4 selected</span>
                </div>
                {[
                  { text: 'GraphQL API design experience', checked: true },
                  { text: 'Kubernetes / container orchestration', checked: true },
                  { text: 'System design for distributed systems', checked: false },
                  { text: 'Team leadership experience (3+ reports)', checked: false },
                ].map((gap, i) => (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-2xl border transition-colors ${gap.checked ? 'bg-blue-500/5 border-blue-500/20' : 'bg-slate-950/50 border-slate-800/50'}`}>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 ${gap.checked ? 'bg-blue-600 border-blue-600' : 'border-slate-700 bg-slate-900'}`}>
                      {gap.checked && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    <p className="text-xs text-slate-300 font-medium">{gap.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Resume Generation ── */}
          <section className="py-16 border-t border-slate-800/60">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Resume output mockup */}
              <div className="p-6 bg-white rounded-2xl shadow-2xl font-serif text-sm leading-relaxed text-slate-800 order-2 lg:order-1">
                <h1 className="text-xl font-bold text-center mb-0.5">Alex Johnson</h1>
                <p className="text-center text-xs text-slate-500 mb-3">alex@example.com · github.com/alexj · San Francisco, CA</p>
                <hr className="border-slate-200 mb-3" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Experience</h2>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs font-bold">
                      <span>Senior Frontend Engineer</span>
                      <span className="text-slate-400">2021 – Present</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium">Acme Corp</p>
                    <ul className="list-disc list-inside text-[10px] text-slate-600 mt-1 space-y-0.5">
                      <li>Built <strong>React</strong> + <strong>TypeScript</strong> dashboard serving 50k DAU</li>
                      <li>Reduced bundle size 40% via code splitting and tree shaking</li>
                      <li>Led <strong>GraphQL</strong> migration from REST, cutting over-fetching by 60%</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">Skills</h2>
                  <p className="text-[10px] text-slate-600">React · TypeScript · GraphQL · CI/CD · Node.js · AWS · Docker · Kubernetes</p>
                </div>
                <div className="mt-1.5 text-[9px] text-center text-slate-300 italic">AI-tailored for: Senior Frontend Engineer at Stripe</div>
              </div>

              <div className="order-1 lg:order-2">
                <SectionHeader label="Resume generation" title="Tailored to each role, automatically" description="Claude AI rewrites your resume to highlight the most relevant experience for the specific job. Not a generic rewrite — a targeted one." />
                <ul className="space-y-3">
                  {['Analyzes both your resume and the job description together', 'Emphasizes matching keywords and skills', 'Fills in gap context you\'ve selected', 'One-click download as Word document (.docx)', 'A4 one-page enforcement with style fitting'].map(item => (
                    <li key={item} className="flex items-center gap-3 text-sm text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* ── Style Presets ── */}
          <section className="py-16 border-t border-slate-800/60">
            <SectionHeader label="Style engine" title="Professional formatting, your way" description="Describe a style in plain English or upload any resume PDF — JobFit extracts fonts, spacing, and layout to match it exactly." />
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { style: 'Modern', font: 'Inter', size: '10pt', cols: '1', color: '#3b82f6', desc: 'Clean single-column with blue headings' },
                { style: 'Classic', font: 'Georgia', size: '11pt', cols: '1', color: '#1e293b', desc: 'Serif font, traditional single-column' },
                { style: 'Bold Two-Column', font: 'Helvetica', size: '10pt', cols: '2', color: '#7c3aed', desc: 'Purple accents, two-column layout' },
              ].map(p => (
                <div key={p.style} className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl border-2 flex-shrink-0" style={{ backgroundColor: p.color, borderColor: p.color }} />
                    <div>
                      <p className="font-black text-white text-sm">{p.style}</p>
                      <p className="text-xs text-slate-500">{p.font} · {p.size} · {p.cols}col</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">{p.desc}</p>
                  <div className="h-px bg-slate-800" />
                  <p className="text-[10px] text-slate-600 uppercase tracking-widest font-black">A4 enforced · DOCX export</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Activity Log ── */}
          <section className="py-16 border-t border-slate-800/60">
            <SectionHeader label="Activity log" title="Track your entire job search" />
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { title: 'Senior Frontend Engineer', company: 'Stripe', score: 85, status: 'Interviewing', statusColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20', date: 'Jan 12' },
                { title: 'Staff Engineer', company: 'Linear', score: 72, status: 'Applied', statusColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20', date: 'Jan 10' },
                { title: 'Frontend Lead', company: 'Vercel', score: 91, status: 'Offer', statusColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', date: 'Jan 8' },
                { title: 'Senior SWE', company: 'Notion', score: 48, status: 'Rejected', statusColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20', date: 'Jan 5' },
              ].map(job => (
                <div key={job.title} className="flex items-center gap-4 p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-black text-white">{job.score}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-white text-sm">{job.title}</p>
                    <p className="text-xs text-slate-500">{job.company} · {job.date}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${job.statusColor}`}>
                    {job.status}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <div className="py-12 text-center">
            <Link href="/how-it-works" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-bold transition-colors">
              See how it all works under the hood <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
