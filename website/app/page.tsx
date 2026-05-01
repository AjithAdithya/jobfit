import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import BetaButton from '@/components/BetaButton'
import ProductShowcase from '@/components/ProductShowcase'
import { ArrowUpRight, ArrowRight } from 'lucide-react'

/* ============================================================
   PAGE
   ============================================================ */
export default function HomePage() {
  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      {/* ── HERO ── */}
      <section className="pt-28 pb-16 lg:pt-40 lg:pb-32 relative">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-8 items-start">

            {/* Left — copy */}
            <div className="lg:col-span-7 relative">
              {/* Eyebrow */}
              <div className="flex items-center gap-3 mb-10">
                <span className="font-mono text-[11px] text-ink-500 tracking-caps uppercase">№ 01 — jobfit ai</span>
                <span className="h-px flex-1 bg-ink-300 max-w-[80px]" />
                <span className="font-mono text-[11px] text-crimson-500 tracking-caps uppercase">chrome extension</span>
              </div>

              {/* Signature headline */}
              <h1 className="font-chunk text-[clamp(3.5rem,9vw,8.5rem)] leading-[0.98] tracking-tightest text-ink-900">
                tailor resumes
                <br />
                that <span className="serif-accent text-crimson-500" style={{ fontSize: '1.08em' }}>fit</span>
                <br />
                the job.
              </h1>

              <p className="mt-10 max-w-lg text-[18px] leading-relaxed text-ink-700">
                A quiet Chrome extension that analyzes any job posting, scores your alignment across <span className="font-mono num text-ink-900">10</span> levels, and generates a tailored resume — in seconds, not hours.
              </p>

              {/* CTAs */}
              <div className="mt-10 flex flex-col sm:flex-row gap-3">
                <BetaButton className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-ink-900 text-cream font-medium text-[15px] rounded-md hover:bg-crimson-500 transition-colors">
                  join the beta
                  <ArrowUpRight className="w-4 h-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </BetaButton>
                <Link
                  href="/how-it-works"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 border border-ink-900 text-ink-900 font-medium text-[15px] rounded-md hover:bg-ink-900 hover:text-cream transition-colors"
                >
                  see how it works
                </Link>
              </div>

              {/* Trust inline */}
              <div className="mt-10 flex flex-wrap gap-x-8 gap-y-2">
                {['bring your own keys', 'your data stays yours', 'no telemetry'].map(t => (
                  <div key={t} className="flex items-center gap-2 text-[13px] text-ink-600">
                    <span className="text-crimson-500 font-mono">✦</span>
                    {t}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — screenshot */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end lg:-mr-6">
              <div className="relative w-full max-w-[360px]">
                <div className="hidden sm:block absolute -top-6 -left-6 font-mono text-[10px] text-ink-400 tracking-caps uppercase">
                  fig. 01 · the extension
                </div>
                <div className="rounded-xl border-4 border-ink-900 shadow-print-xl overflow-hidden bg-ink-900">
                  <Image
                    src="/screenshots/ext-03-match-score.png"
                    alt="JobFit extension showing your match score"
                    width={360}
                    height={640}
                    className="w-full h-auto block"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section className="border-y border-ink-900 bg-ink-900 text-cream py-10">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { num: '10', label: 'match levels' },
              { num: '5s', label: 'analysis time' },
              { num: '00', label: 'keys we store' },
              { num: '∞', label: 'tailored resumes' },
            ].map(stat => (
              <div key={stat.label}>
                <div className="font-chunk text-[clamp(2.5rem,6vw,4.5rem)] leading-none text-cream">
                  {stat.num}
                </div>
                <div className="font-mono text-[10px] text-cream/60 tracking-caps uppercase mt-2">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRODUCT SHOWCASE — three-act narrative ── */}
      <ProductShowcase />

      {/* ── THE SIX FEATURES — editorial grid ── */}
      <section className="py-16 lg:py-32">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid lg:grid-cols-12 gap-8 mb-16">
            <div className="lg:col-span-5">
              <p className="font-mono text-[11px] text-crimson-500 tracking-caps uppercase mb-4">№ 05 — the toolkit</p>
              <h2 className="font-chunk text-big text-ink-900">
                six <span className="serif-accent text-crimson-500">precise</span> tools.<br />
                nothing more.
              </h2>
            </div>
            <div className="lg:col-span-6 lg:col-start-7 pt-4">
              <p className="text-[17px] leading-relaxed text-ink-600">
                No bloat. No dashboards-for-the-sake-of-dashboards. Every feature exists because it shortens the path from "found a job posting" to "submitted a tailored application."
              </p>
            </div>
          </div>

          {/* Feature grid — asymmetric */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 border-t border-l border-ink-900">
            {[
              { num: '01', title: 'Match scoring', accent: 'across ten named levels', desc: 'Not a naked number. Every score maps to a named level — from "no fit" to "elite fit" — with a specific subtitle that tells you what to do next.' },
              { num: '02', title: 'Gap analysis', accent: 'with semantic matching', desc: 'Your resume is chunked and embedded via Voyage AI\'s resume-2 model. Gaps surface through cosine similarity against the job\'s semantic vector — not keyword stuffing.' },
              { num: '03', title: 'Resume generation', accent: 'tailored, not generic', desc: 'Claude Sonnet rewrites your master resume to emphasize matching experience and address the gaps you\'ve selected. One click. One A4 page. One .docx.' },
              { num: '04', title: 'Style presets', accent: 'describe or upload', desc: 'Describe a style in plain English — "modern, Inter, blue headings" — or upload any resume PDF and the system extracts its fonts, spacing, and layout exactly.' },
              { num: '05', title: 'Activity log', accent: 'the whole pipeline, visible', desc: 'Evaluating. Applied. Interviewing. Offer. Rejected. Five status columns, one page, every job you\'ve ever touched.' },
              { num: '06', title: 'Privacy by design', accent: 'BYOK, always', desc: 'Your Anthropic and Voyage keys live in chrome.storage.local. API calls go from your browser, directly to the provider. We\'re never in the loop.' },
            ].map(f => (
              <div key={f.num} className="border-r border-b border-ink-900 p-5 sm:p-8 lg:p-10 hover:bg-ink-900 hover:text-cream transition-colors group cursor-default">
                <div className="font-mono text-[11px] text-ink-400 tracking-caps uppercase mb-6 group-hover:text-cream/60">№ {f.num}</div>
                <h3 className="font-chunk text-[28px] leading-tight tracking-tight text-ink-900 group-hover:text-cream mb-2">
                  {f.title}
                </h3>
                <p className="font-serif italic text-[18px] text-crimson-500 group-hover:text-citrus mb-4 leading-snug">
                  {f.accent}
                </p>
                <p className="text-[14px] text-ink-600 group-hover:text-cream/70 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS — editorial three-step ── */}
      <section className="py-16 lg:py-32 bg-ink-900 text-cream">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="mb-16">
            <p className="font-mono text-[11px] text-citrus tracking-caps uppercase mb-4">№ 06 — the workflow</p>
            <h2 className="font-chunk text-big">
              from job post to tailored resume<br />
              in <span className="serif-accent text-citrus">three</span> steps.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12 lg:gap-8">
            {[
              { num: '01', title: 'upload once', body: 'Upload your master resume PDF. It\'s parsed, chunked, and embedded by Voyage AI into your Supabase project with pgvector.' },
              { num: '02', title: 'open any job', body: 'Browse to any job posting in Chrome. Click the JobFit icon. The extension scrapes the page and compares it to your embeddings.' },
              { num: '03', title: 'generate & download', body: 'Review the score, select gaps to address, hit generate. Claude writes you a tailored resume, you download the .docx.' },
            ].map(step => (
              <div key={step.num} className="relative">
                <div className="font-chunk text-[clamp(4rem,10vw,7rem)] leading-none text-crimson-500 mb-6 tracking-tightest">
                  {step.num}
                </div>
                <h3 className="font-chunk text-[26px] leading-tight tracking-tight mb-4 text-cream">
                  {step.title}
                </h3>
                <p className="text-[15px] text-cream/70 leading-relaxed">
                  {step.body}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-16 pt-8 border-t border-cream/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="font-mono text-[11px] text-cream/60 tracking-caps uppercase">multi-agent pipeline · voyage embeddings · claude haiku + sonnet</p>
            <Link href="/how-it-works" className="inline-flex items-center gap-2 text-cream hover:text-citrus transition-colors text-[15px] underline decoration-1 underline-offset-4">
              read the full architecture <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── PULL QUOTE ── */}
      <section className="py-16 lg:py-32">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-10">
          <p className="font-mono text-[11px] text-ink-400 tracking-caps uppercase mb-10 text-center">№ 07 — principle</p>
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <blockquote className="font-serif italic text-[clamp(2rem,4vw,3.5rem)] leading-[1.1] text-ink-900">
                "your keys,<br />
                your data,<br />
                <span className="text-crimson-500">your control</span>."
              </blockquote>
              <p className="text-[14px] text-ink-500 mt-8 max-w-sm">
                Three privacy principles, in order of importance. Bring your own Anthropic and Voyage API keys. They live in your browser. They never touch our servers.
              </p>
              <div className="mt-8">
                <Link
                  href="/privacy"
                  className="inline-flex items-center gap-2 px-6 py-3 border border-ink-900 text-ink-900 rounded-md hover:bg-ink-900 hover:text-cream transition-colors text-[15px]"
                >
                  read the full privacy policy <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
            {/* Settings screenshot — proof of principle */}
            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-[260px]">
                <div className="rounded-xl border-[3px] border-ink-900 overflow-hidden bg-ink-900 shadow-lg">
                  <Image
                    src="/screenshots/ext-02-settings.png"
                    alt="JobFit settings — your API keys stored locally in your browser"
                    width={390}
                    height={844}
                    className="w-full h-auto block"
                  />
                </div>
                <p className="font-mono text-[9px] text-ink-400 tracking-caps uppercase mt-3 text-center">your keys. your browser.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-16 lg:py-32 border-t border-ink-900">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-7">
              <p className="font-mono text-[11px] text-crimson-500 tracking-caps uppercase mb-4">№ 08 — ready?</p>
              <h2 className="font-chunk text-[clamp(3rem,7vw,6.5rem)] leading-[0.98] tracking-tightest text-ink-900">
                install it.<br />
                land the <span className="serif-accent text-crimson-500">interview</span>.
              </h2>
            </div>
            <div className="lg:col-span-5 flex flex-col gap-3">
              <BetaButton className="inline-flex items-center justify-between gap-2 px-8 py-5 bg-crimson-500 text-cream font-medium text-[16px] rounded-md hover:bg-crimson-600 transition-colors group">
                request early access
                <ArrowUpRight className="w-5 h-5" />
              </BetaButton>
              <Link
                href="/features"
                className="inline-flex items-center justify-between gap-2 px-8 py-5 bg-cream border border-ink-900 text-ink-900 font-medium text-[16px] rounded-md hover:bg-ink-900 hover:text-cream transition-colors"
              >
                explore every feature <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
