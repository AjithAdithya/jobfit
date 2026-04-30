import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

function SectionLabel({ num, label }: { num: string; label: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="font-mono text-[11px] text-crimson-500 tracking-caps uppercase">№ {num}</span>
      <span className="h-px bg-ink-300 flex-1 max-w-[80px]" />
      <span className="font-mono text-[11px] text-ink-500 tracking-caps uppercase">{label}</span>
    </div>
  )
}

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      {/* ── Hero ── */}
      <section className="pt-32 pb-16 lg:pt-40 lg:pb-20">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <SectionLabel num="01" label="architecture" />
          <h1 className="font-chunk text-[clamp(3rem,8vw,7.5rem)] leading-[0.98] tracking-tightest text-ink-900 max-w-5xl">
            how <span className="serif-accent text-crimson-500">jobfit</span>
            <br />
            actually works.
          </h1>
          <p className="mt-8 max-w-2xl text-[18px] leading-relaxed text-ink-600">
            A multi-agent AI pipeline running entirely in your browser, backed by your own Supabase project and your own API keys. No servers in the loop. No black boxes.
          </p>
        </div>
      </section>

      {/* ── System Overview ── */}
      <section className="py-16 lg:py-24 border-t border-ink-900">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <SectionLabel num="02" label="system components" />
          <h2 className="font-chunk text-big text-ink-900 max-w-3xl mb-12">
            four <span className="serif-accent text-crimson-500">things</span> stitched together.
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 border-t border-l border-ink-900">
            {[
              { num: '01', name: 'your api keys', sub: 'Anthropic + Voyage AI', desc: 'Stored only in chrome.storage.local.' },
              { num: '02', name: 'your supabase', sub: 'Postgres + pgvector', desc: 'Resumes, history, styles, usage — all in your project.' },
              { num: '03', name: 'claude ai', sub: 'Haiku + Sonnet', desc: 'Haiku for analysis and style extraction. Sonnet for generation.' },
              { num: '04', name: 'voyage ai', sub: 'resume-2 model', desc: 'Semantic embeddings, specifically trained on resume corpora.' },
            ].map(c => (
              <div key={c.num} className="border-r border-b border-ink-900 p-5 sm:p-8 bg-cream">
                <p className="font-mono text-[10px] text-ink-400 tracking-caps uppercase mb-4">№ {c.num}</p>
                <h3 className="font-chunk text-[24px] tracking-tight text-ink-900">{c.name}</h3>
                <p className="font-serif italic text-[15px] text-crimson-500 mt-1">{c.sub}</p>
                <p className="text-[13px] text-ink-600 mt-4 leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Two flows ── */}
      <section className="py-16 lg:py-24 border-t border-ink-900">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <SectionLabel num="03" label="the pipeline" />
          <h2 className="font-chunk text-big text-ink-900 max-w-3xl mb-12 lg:mb-16">
            two <span className="serif-accent text-crimson-500">flows</span>.<br />
            one-time &amp; on-demand.
          </h2>

          <div className="grid lg:grid-cols-2 gap-10 lg:gap-24">

            {/* Flow 1 */}
            <div>
              <p className="font-mono text-[11px] text-crimson-500 tracking-caps uppercase mb-3">flow a · one-time</p>
              <h3 className="font-chunk text-[32px] tracking-tight text-ink-900 mb-2">resume ingestion</h3>
              <p className="text-[14px] text-ink-500 italic font-serif mb-8">runs once, when you upload your master resume</p>

              <ol className="space-y-6 relative">
                <div className="absolute left-[11px] top-3 bottom-3 w-px bg-ink-300" />
                {[
                  { title: 'upload pdf', desc: 'You upload your master resume via the Vault tab. 5 MB max.' },
                  { title: 'parse text', desc: 'pdfjs-dist extracts text and font metadata — all in-browser.' },
                  { title: 'vectorize', desc: 'Text is chunked and sent to Voyage\'s resume-2 model for embeddings.' },
                  { title: 'store', desc: 'Vectors land in your Supabase project\'s resume_chunkies table via pgvector.' },
                ].map((step, i) => (
                  <li key={i} className="flex gap-4 relative bg-cream">
                    <div className="w-6 h-6 rounded-full border border-ink-900 bg-cream flex items-center justify-center flex-shrink-0 font-mono text-[10px] font-medium num">
                      {i+1}
                    </div>
                    <div>
                      <h4 className="font-chunk text-[18px] tracking-tight text-ink-900">{step.title}</h4>
                      <p className="text-[14px] text-ink-600 leading-relaxed mt-1">{step.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Flow 2 */}
            <div>
              <p className="font-mono text-[11px] text-crimson-500 tracking-caps uppercase mb-3">flow b · on-demand</p>
              <h3 className="font-chunk text-[32px] tracking-tight text-ink-900 mb-2">analysis &amp; generation</h3>
              <p className="text-[14px] text-ink-500 italic font-serif mb-8">runs each time you analyze a job</p>

              <ol className="space-y-6 relative">
                <div className="absolute left-[11px] top-3 bottom-3 w-px bg-ink-300" />
                {[
                  { title: 'click analyze', desc: 'Open a job posting, click the JobFit toolbar icon.' },
                  { title: 'scrape + vectorize', desc: 'The page is scraped and embedded for comparison.' },
                  { title: 'match analysis', desc: 'Claude Haiku + cosine similarity produce score, strengths, gaps, keywords.' },
                  { title: 'generate resume', desc: 'Claude Sonnet rewrites your resume using all matched context.' },
                  { title: 'enforce A4', desc: 'Output is iteratively style-fitted to one A4 page, then exported as .docx.' },
                ].map((step, i) => (
                  <li key={i} className="flex gap-4 relative bg-cream">
                    <div className="w-6 h-6 rounded-full border border-ink-900 bg-cream flex items-center justify-center flex-shrink-0 font-mono text-[10px] font-medium num">
                      {i+1}
                    </div>
                    <div>
                      <h4 className="font-chunk text-[18px] tracking-tight text-ink-900">{step.title}</h4>
                      <p className="text-[14px] text-ink-600 leading-relaxed mt-1">{step.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* ── Agents ── */}
      <section className="py-16 lg:py-24 border-t border-ink-900 bg-ink-900 text-cream">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex items-center gap-3 mb-6">
            <span className="font-mono text-[11px] text-citrus tracking-caps uppercase">№ 04</span>
            <span className="h-px bg-cream/30 flex-1 max-w-[80px]" />
            <span className="font-mono text-[11px] text-cream/60 tracking-caps uppercase">agents</span>
          </div>
          <h2 className="font-chunk text-big text-cream max-w-3xl mb-12">
            specialized <span className="serif-accent text-citrus">agents</span>.<br />
            each with one job.
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-cream/20 border border-cream/20">
            {[
              { name: 'analyzer', model: 'claude haiku', desc: 'Reads job description + resume chunks. Computes match score. Extracts strengths, gaps, keywords.' },
              { name: 'resume writer', model: 'claude sonnet', desc: 'Full rewrite targeting the specific job. Selected gaps treated as hard requirements.' },
              { name: 'cover letter', model: 'claude sonnet', desc: 'Tone-aware generation — Professional, Casual, Enthusiastic. Uses full job + resume context.' },
              { name: 'stylist', model: 'claude haiku', desc: 'Turns plain-English style descriptions into structured ResumeStyle JSON.' },
              { name: 'style extractor', model: 'claude haiku', desc: 'Reads font, size, spacing from a template PDF. Produces matching ResumeStyle.' },
              { name: 'embedding pipeline', model: 'voyage resume-2', desc: 'Not an LLM — chunks your resume into dense semantic vectors for similarity search.' },
            ].map(agent => (
              <div key={agent.name} className="p-5 sm:p-8 bg-ink-900">
                <p className="font-mono text-[10px] text-citrus tracking-caps uppercase mb-3">{agent.model}</p>
                <h3 className="font-chunk text-[24px] tracking-tight text-cream mb-3">
                  {agent.name}
                </h3>
                <p className="text-[14px] text-cream/70 leading-relaxed">{agent.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Scoring model ── */}
      <section className="py-16 lg:py-24 border-t border-ink-900">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <SectionLabel num="05" label="scoring model" />
          <h2 className="font-chunk text-big text-ink-900 max-w-3xl mb-4">
            how the <span className="serif-accent text-crimson-500">match score</span> is built.
          </h2>
          <p className="text-[16px] text-ink-500 italic font-serif max-w-2xl mb-12">
            nine dimensions, weighted, then capped. not a vibe — a rubric.
          </p>

          {/* Weights table */}
          <div className="border-t border-l border-ink-900 mb-12">
            {[
              { num: '01', name: 'hard skills overlap',          weight: 25, desc: 'must-have technical skills demonstrably present in the resume. adjacent skills count partial. missing any must-have caps the final score at 65.' },
              { num: '02', name: 'years of relevant experience', weight: 15, desc: 'years of experience in the same role family vs jd requirement. curve, not cliff: at-target = 100, 1yr short = 80, 2yr = 55, 3+ short = 30.' },
              { num: '03', name: 'responsibility overlap',       weight: 15, desc: 'embedding-based comparison of past duties to the jd\'s "what you\'ll do". this is the "have they actually done this work" signal.' },
              { num: '04', name: 'quantified impact',            weight: 10, desc: 'count of metric-bearing bullets, plus a bonus when the metric type matches the jd outcome (e.g. "improve conversion" + a conversion-lift number).' },
              { num: '05', name: 'domain / industry match',      weight: 10, desc: 'same vertical = 100, adjacent = 70, transferable = 40, unrelated = 15.' },
              { num: '06', name: 'seniority alignment',          weight: 10, desc: 'ic level vs jd level — same level = 100, one off = 60, two+ off = 25. under-leveling penalised harder than over-leveling.' },
              { num: '07', name: 'soft skills & leadership',     weight: 5,  desc: 'mentorship, cross-functional ownership, exec-presentation signals. only material if the jd explicitly asks for them.' },
              { num: '08', name: 'education & certifications',   weight: 5,  desc: 'required degree or cert met = 100, missing required = 0. preferred items contribute partial credit.' },
              { num: '09', name: 'location / work auth',         weight: 5,  desc: 'timezone, on-site requirement, visa needs. a hard auth blocker caps the final score at 40 and surfaces a warning.' },
            ].map(row => (
              <div key={row.num} className="border-r border-b border-ink-900 px-4 md:px-6 py-4 md:py-5 bg-cream">
                {/* Mobile: stacked. Desktop: 12-col grid */}
                <div className="flex items-baseline gap-3 mb-1 md:hidden">
                  <span className="font-mono text-[10px] text-ink-400 tracking-caps uppercase">№ {row.num}</span>
                  <span className="num font-chunk text-[22px] leading-none tracking-tight text-crimson-500">{row.weight}<span className="text-[14px] text-ink-400">%</span></span>
                </div>
                <h4 className="font-chunk text-[17px] md:hidden tracking-tight text-ink-900 mb-1">{row.name}</h4>
                <p className="text-[13px] md:hidden text-ink-600 leading-relaxed">{row.desc}</p>
                {/* Desktop row */}
                <div className="hidden md:grid md:grid-cols-12 md:gap-4 md:items-baseline">
                  <span className="col-span-1 font-mono text-[10px] text-ink-400 tracking-caps uppercase">№ {row.num}</span>
                  <h4 className="col-span-5 font-chunk text-[18px] tracking-tight text-ink-900">{row.name}</h4>
                  <span className="col-span-1 num font-chunk text-[28px] leading-none tracking-tight text-crimson-500">{row.weight}<span className="text-[16px] text-ink-400">%</span></span>
                  <p className="col-span-5 text-[13px] text-ink-600 leading-relaxed">{row.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Caps */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <p className="font-mono text-[11px] text-crimson-500 tracking-caps uppercase mb-3">composite</p>
              <h3 className="font-chunk text-[28px] tracking-tight text-ink-900 mb-3">weighted sum, then capped</h3>
              <p className="text-[14px] text-ink-600 leading-relaxed">
                each dimension is scored 0&ndash;100 by claude with a structured rubric. the host computes the
                weighted average client-side, so weights stay legible, deterministic, and tunable per role family without prompt edits.
              </p>
            </div>
            <div>
              <p className="font-mono text-[11px] text-crimson-500 tracking-caps uppercase mb-3">caps &amp; guardrails</p>
              <ul className="space-y-2 text-[13px] text-ink-700">
                {[
                  ['missing must-have skill',     'final ≤ 65'],
                  ['missing required cert',       'final ≤ 70'],
                  ['3+ years short on experience','final ≤ 70'],
                  ['visa / work-auth blocker',    'final ≤ 40 + warning'],
                  ['no quantified impact',        '−5 final'],
                  ['jd under 100 words',          'flagged low confidence'],
                ].map(([trigger, effect]) => (
                  <li key={trigger} className="flex items-baseline gap-3 border-b border-ink-200 pb-2">
                    <span className="text-crimson-500 font-mono text-[10px] mt-0.5">→</span>
                    <span className="flex-1">{trigger}</span>
                    <span className="font-mono text-[10px] text-ink-500 tracking-caps uppercase">{effect}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Privacy architecture ── */}
      <section className="py-16 lg:py-24 border-t border-ink-900">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <SectionLabel num="06" label="privacy architecture" />
          <h2 className="font-chunk text-big text-ink-900 max-w-3xl mb-12">
            three <span className="serif-accent text-crimson-500">boundaries</span> of data.
          </h2>

          <div className="grid md:grid-cols-3 border-t border-l border-ink-900">

            {/* Browser only */}
            <div className="border-r border-b border-ink-900 p-5 sm:p-8 bg-citrus/20">
              <p className="font-mono text-[10px] text-ink-900 tracking-caps uppercase mb-3">zone 1 · your browser only</p>
              <h3 className="font-chunk text-[22px] tracking-tight text-ink-900 mb-4">never leaves your machine</h3>
              <ul className="space-y-2">
                {['Anthropic API key', 'Voyage AI key', 'AI call traffic (direct to providers)', 'Session / auth cookies'].map(x => (
                  <li key={x} className="flex items-start gap-2 text-[14px] text-ink-900">
                    <span className="text-crimson-500 font-mono mt-0.5">✦</span>
                    {x}
                  </li>
                ))}
              </ul>
            </div>

            {/* Your Supabase */}
            <div className="border-r border-b border-ink-900 p-5 sm:p-8 bg-sky/15">
              <p className="font-mono text-[10px] text-ink-900 tracking-caps uppercase mb-3">zone 2 · your supabase</p>
              <h3 className="font-chunk text-[22px] tracking-tight text-ink-900 mb-4">data namespaced to you</h3>
              <ul className="space-y-2">
                {['Resume text & embeddings', 'Analysis history', 'Generated resumes & cover letters', 'Style presets'].map(x => (
                  <li key={x} className="flex items-start gap-2 text-[14px] text-ink-900">
                    <span className="text-crimson-500 font-mono mt-0.5">✦</span>
                    {x}
                  </li>
                ))}
              </ul>
            </div>

            {/* Never collected */}
            <div className="border-r border-b border-ink-900 p-5 sm:p-8 bg-ink-900 text-cream">
              <p className="font-mono text-[10px] text-citrus tracking-caps uppercase mb-3">zone 3 · never collected</p>
              <h3 className="font-chunk text-[22px] tracking-tight text-cream mb-4">doesn't exist on our end</h3>
              <ul className="space-y-2">
                {['API keys', 'Resume content', 'Job descriptions', 'Telemetry, analytics, tracking'].map(x => (
                  <li key={x} className="flex items-start gap-2 text-[14px] text-cream/80">
                    <span className="text-citrus font-mono mt-0.5">✦</span>
                    {x}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <p className="text-[14px] text-ink-500 italic font-serif max-w-lg">
              The Chrome extension uses anthropic-dangerous-direct-browser-access — AI calls go straight from your browser to Anthropic. We are never in the loop.
            </p>
            <Link
              href="/privacy"
              className="inline-flex items-center gap-2 px-6 py-3 border border-ink-900 text-ink-900 rounded-md hover:bg-ink-900 hover:text-cream transition-colors text-[15px] whitespace-nowrap"
            >
              read privacy policy <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
