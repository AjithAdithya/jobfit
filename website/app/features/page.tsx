import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { ALL_LEVELS } from '@/lib/matchLevel'
import { ArrowRight, Check } from 'lucide-react'

function SectionLabel({ num, label }: { num: string; label: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="font-mono text-[11px] text-crimson-500 tracking-caps uppercase">№ {num}</span>
      <span className="h-px bg-ink-300 flex-1 max-w-[80px]" />
      <span className="font-mono text-[11px] text-ink-500 tracking-caps uppercase">{label}</span>
    </div>
  )
}

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      {/* ── Hero ── */}
      <section className="pt-32 pb-16 lg:pt-40 lg:pb-20">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <SectionLabel num="01" label="features" />
          <h1 className="font-chunk text-[clamp(3rem,8vw,7.5rem)] leading-[0.98] tracking-tightest text-ink-900 max-w-5xl">
            every tool
            <br />
            you need to <span className="serif-accent text-crimson-500">fit</span>
            <br />
            the job.
          </h1>
          <p className="mt-8 max-w-2xl text-[18px] leading-relaxed text-ink-600">
            Six features, each designed to compress the path from "found a job" to "submitted a tailored application." No bloat, no upsells, no gatekeeping.
          </p>
        </div>
      </section>

      {/* ── Match scoring — 10 levels ── */}
      <section className="py-16 lg:py-24 border-t border-ink-900">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid lg:grid-cols-12 gap-8 mb-12">
            <div className="lg:col-span-5">
              <SectionLabel num="01" label="scoring engine" />
              <h2 className="font-chunk text-big text-ink-900">
                ten <span className="serif-accent text-crimson-500">named</span> levels.
              </h2>
            </div>
            <div className="lg:col-span-6 lg:col-start-7 pt-4">
              <p className="text-[17px] text-ink-600 leading-relaxed">
                A compatibility score without context is just trivia. Every JobFit score maps to a named level with a one-line subtitle — so you know exactly what the number means before you apply.
              </p>
            </div>
          </div>

          {/* Levels table */}
          <div className="border-t border-ink-900">
            {ALL_LEVELS.map(level => (
              <div key={level.label} className="flex items-center gap-3 sm:grid sm:grid-cols-12 sm:gap-4 py-4 sm:py-5 border-b border-ink-200 hover:bg-ink-50 transition-colors">
                <div
                  className="w-3 h-3 sm:hidden rounded-full shrink-0"
                  style={{ background: `linear-gradient(135deg, ${level.gradientFrom}, ${level.gradientTo})` }}
                />
                <div className="sm:col-span-2 num text-[20px] sm:text-[22px] font-medium text-ink-900 shrink-0">
                  {level.min}+
                </div>
                <div className="flex-1 sm:col-span-4 font-chunk text-[18px] sm:text-[22px] tracking-tight text-ink-900">
                  {level.label}
                </div>
                <div className="hidden sm:block sm:col-span-5 text-[14px] text-ink-500 italic font-serif">
                  {level.subtitle}
                </div>
                <div className="hidden sm:col-span-1 sm:flex justify-end">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ background: `linear-gradient(135deg, ${level.gradientFrom}, ${level.gradientTo})` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Gap Analysis ── */}
      <section className="py-16 lg:py-24 border-t border-ink-900">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-6">
              <SectionLabel num="02" label="gap analysis" />
              <h2 className="font-chunk text-big text-ink-900 mb-6">
                see exactly what's <span className="serif-accent text-crimson-500">missing</span>.
              </h2>
              <p className="text-[17px] text-ink-600 leading-relaxed mb-8">
                Your resume is compared semantically to the job description using Voyage AI embeddings. Not keyword matching — vector similarity. What surfaces are the actual gaps, ranked.
              </p>
              <ul className="space-y-3">
                {[
                  'Semantic matching via pgvector',
                  'Checkbox-based gap selection',
                  'Persists to your history',
                  'Feeds resume generation context',
                ].map((item, i) => (
                  <li key={item} className="flex items-center gap-4 text-[15px] text-ink-900">
                    <span className="font-mono text-[10px] text-ink-400 num tracking-caps">0{i+1}</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Mockup */}
            <div className="lg:col-span-6">
              <div className="border border-ink-900 bg-cream p-6">
                <p className="font-mono text-[10px] text-ink-500 tracking-caps uppercase mb-4">recommended gaps · 2/4 addressed</p>
                <ul className="space-y-2">
                  {[
                    { text: 'GraphQL API design experience', on: true },
                    { text: 'Kubernetes / container orchestration', on: true },
                    { text: 'System design for distributed systems', on: false },
                    { text: 'Team leadership experience (3+ reports)', on: false },
                  ].map((g, i) => (
                    <li key={i} className={`flex items-start gap-3 p-3 border ${g.on ? 'border-ink-900 bg-ink-900 text-cream' : 'border-ink-200'}`}>
                      <div className={`w-4 h-4 border flex items-center justify-center flex-shrink-0 mt-0.5 ${g.on ? 'bg-citrus border-citrus' : 'border-ink-400'}`}>
                        {g.on && <Check className="w-3 h-3 text-ink-900 stroke-[3]" />}
                      </div>
                      <span className="text-[13px]">{g.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Resume Generation ── */}
      <section className="py-16 lg:py-24 border-t border-ink-900">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            {/* Resume mockup */}
            <div className="lg:col-span-6 order-2 lg:order-1">
              <div className="bg-white border border-ink-900 p-8 shadow-print-lg font-serif text-sm text-ink-900">
                <h1 className="text-xl font-bold text-center mb-1" style={{fontFamily:'Georgia, serif'}}>Alex Johnson</h1>
                <p className="text-center text-[10px] text-ink-500 mb-3">alex@example.com · github.com/alexj · San Francisco, CA</p>
                <hr className="border-ink-200 mb-3" />
                <h2 className="text-[10px] font-bold uppercase tracking-caps text-ink-500 mb-2 font-mono">Experience</h2>
                <div>
                  <div className="flex justify-between text-[12px] font-bold">
                    <span>Senior Frontend Engineer</span>
                    <span className="text-ink-500 font-mono num">2021 – Present</span>
                  </div>
                  <p className="text-[10px] text-ink-500 italic">Acme Corp</p>
                  <ul className="list-disc list-inside text-[10px] text-ink-600 mt-1 space-y-0.5">
                    <li>Built <span className="font-bold bg-citrus/40">React</span> + <span className="font-bold bg-citrus/40">TypeScript</span> dashboard serving 50k DAU</li>
                    <li>Reduced bundle size 40% via code splitting and tree shaking</li>
                    <li>Led <span className="font-bold bg-citrus/40">GraphQL</span> migration from REST, cutting over-fetching 60%</li>
                  </ul>
                </div>
                <div className="mt-4 pt-2 border-t border-ink-100">
                  <h2 className="text-[10px] font-bold uppercase tracking-caps text-ink-500 mb-1 font-mono">Skills</h2>
                  <p className="text-[10px] text-ink-600">
                    <span className="font-bold bg-citrus/40">React</span> · <span className="font-bold bg-citrus/40">TypeScript</span> · <span className="font-bold bg-citrus/40">GraphQL</span> · <span className="font-bold bg-citrus/40">CI/CD</span> · Node.js · AWS · Docker · Kubernetes
                  </p>
                </div>
                <div className="mt-3 text-[9px] text-center text-ink-300 italic font-mono">[AI-tailored for: Senior Frontend Engineer at Stripe]</div>
              </div>
            </div>

            <div className="lg:col-span-6 order-1 lg:order-2">
              <SectionLabel num="03" label="resume generation" />
              <h2 className="font-chunk text-big text-ink-900 mb-6">
                tailored, <span className="serif-accent text-crimson-500">not</span> generic.
              </h2>
              <p className="text-[17px] text-ink-600 leading-relaxed mb-8">
                Claude Sonnet reads both your master resume and the job description together. It emphasizes matching experience, weaves in the keywords you've selected, and addresses gaps with your existing language.
              </p>
              <ul className="space-y-3">
                {[
                  'Full context of resume + job description',
                  'Selected gaps treated as requirements',
                  'Keywords highlighted in output',
                  'One-click export to .docx',
                  'A4 one-page enforcement via iterative fitting',
                ].map((item, i) => (
                  <li key={item} className="flex items-center gap-4 text-[15px] text-ink-900">
                    <span className="font-mono text-[10px] text-ink-400 num tracking-caps">0{i+1}</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Style Presets ── */}
      <section className="py-16 lg:py-24 border-t border-ink-900">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="mb-12">
            <SectionLabel num="04" label="style engine" />
            <h2 className="font-chunk text-big text-ink-900 max-w-3xl">
              professional formatting, <span className="serif-accent text-crimson-500">your</span> way.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 border-t border-l border-ink-900">
            {[
              { style: 'modern', font: 'Inter', size: '10pt', cols: '1col', color: '#C01414', desc: 'Clean single-column with crimson headings.' },
              { style: 'classic', font: 'Georgia', size: '11pt', cols: '1col', color: '#0A0B0E', desc: 'Serif font, traditional single-column.' },
              { style: 'two-column', font: 'Helvetica', size: '10pt', cols: '2col', color: '#FF4D2E', desc: 'Flare accents, two-column density.' },
            ].map(p => (
              <div key={p.style} className="border-r border-b border-ink-900 p-5 sm:p-8 bg-cream">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 border-2 flex-shrink-0" style={{ background: p.color, borderColor: p.color }} />
                  <div>
                    <p className="font-chunk text-[22px] tracking-tight text-ink-900">{p.style}</p>
                    <p className="font-mono text-[10px] text-ink-500 tracking-caps uppercase">{p.font} · {p.size} · {p.cols}</p>
                  </div>
                </div>
                <p className="text-[14px] text-ink-600 leading-relaxed mb-4">{p.desc}</p>
                <div className="flex items-center gap-3 pt-4 border-t border-ink-200">
                  <span className="font-mono text-[10px] text-ink-500 tracking-caps uppercase">A4 enforced</span>
                  <span className="text-ink-300">·</span>
                  <span className="font-mono text-[10px] text-ink-500 tracking-caps uppercase">.docx</span>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-8 text-[14px] text-ink-500 italic font-serif">
            Or describe a style in plain English — "modern, Inter, crimson headers, tight spacing" — and the stylist agent returns a complete style object.
          </p>
        </div>
      </section>

      {/* ── Activity log ── */}
      <section className="py-16 lg:py-24 border-t border-ink-900">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="mb-12">
            <SectionLabel num="05" label="activity log" />
            <h2 className="font-chunk text-big text-ink-900 max-w-3xl">
              the whole <span className="serif-accent text-crimson-500">pipeline</span>, visible.
            </h2>
          </div>

          {/* Pipeline badges */}
          <div className="flex flex-wrap gap-3 mb-8">
            {[
              { label: 'evaluating', color: 'border-ink-300 text-ink-500' },
              { label: 'applied', color: 'border-sky text-sky bg-sky/5' },
              { label: 'interviewing', color: 'border-ink-900 text-ink-900 bg-ink-900/5' },
              { label: 'offer', color: 'border-citrus text-ink-900 bg-citrus' },
              { label: 'rejected', color: 'border-flare text-flare bg-flare/5' },
            ].map(s => (
              <span key={s.label} className={`font-mono text-[11px] tracking-caps uppercase px-4 py-2 border ${s.color}`}>
                {s.label}
              </span>
            ))}
          </div>

          {/* Sample rows */}
          <div className="border-t border-ink-900">
            {[
              { score: 91, title: 'Frontend Lead', company: 'Vercel', status: 'offer', date: 'Jan 08' },
              { score: 85, title: 'Senior Frontend Engineer', company: 'Stripe', status: 'interviewing', date: 'Jan 12' },
              { score: 72, title: 'Staff Engineer', company: 'Linear', status: 'applied', date: 'Jan 10' },
              { score: 48, title: 'Senior SWE', company: 'Notion', status: 'rejected', date: 'Jan 05' },
            ].map(job => (
              <div key={job.title} className="flex items-center gap-3 sm:grid sm:grid-cols-12 sm:gap-4 py-4 sm:py-5 border-b border-ink-200 hover:bg-ink-50 transition-colors">
                <div className="num text-[24px] sm:text-[28px] font-chunk text-ink-900 sm:col-span-1 shrink-0">{job.score}</div>
                <div className="flex-1 sm:col-span-5 min-w-0">
                  <p className="font-chunk text-[16px] sm:text-[18px] tracking-tight text-ink-900 truncate">{job.title}</p>
                  <p className="text-[12px] sm:text-[13px] text-ink-500">{job.company}</p>
                </div>
                <div className="hidden sm:block sm:col-span-3 font-mono text-[11px] text-ink-400 tracking-caps uppercase">{job.date}</div>
                <div className="sm:col-span-3 sm:flex sm:justify-end shrink-0">
                  <span className="font-mono text-[10px] tracking-caps uppercase px-2 sm:px-3 py-1 border border-ink-900">{job.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 border-t border-ink-900 bg-ink-900 text-cream">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
          <div>
            <p className="font-mono text-[11px] text-citrus tracking-caps uppercase mb-3">№ 06</p>
            <h3 className="font-chunk text-[clamp(2rem,4vw,3.5rem)] leading-tight">
              see <span className="serif-accent text-citrus">how</span> it all works.
            </h3>
          </div>
          <Link
            href="/how-it-works"
            className="inline-flex items-center gap-3 px-8 py-4 bg-citrus text-ink-900 font-medium text-[16px] rounded-md hover:bg-cream transition-colors whitespace-nowrap"
          >
            read the architecture <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
