import Image from 'next/image'

function PhoneFrame({ src, alt, size = 'lg' }: { src: string; alt: string; size?: 'sm' | 'lg' }) {
  return (
    <div className={[
      'border-[3px] border-ink-900 overflow-hidden bg-ink-900 shadow-lg',
      size === 'lg' ? 'rounded-[2rem]' : 'rounded-[1.5rem]',
    ].join(' ')}>
      <Image
        src={src}
        alt={alt}
        width={390}
        height={844}
        className="w-full h-auto block"
      />
    </div>
  )
}

function BrowserFrame({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="rounded-lg border border-ink-900 overflow-hidden shadow-lg">
      <div className="bg-ink-200 px-3 py-2 flex items-center gap-1.5 border-b border-ink-300">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-2.5 h-2.5 rounded-full bg-ink-400" />
        ))}
      </div>
      <Image
        src={src}
        alt={alt}
        width={1440}
        height={900}
        className="w-full h-auto block"
      />
    </div>
  )
}

export default function ProductShowcase() {
  return (
    <>
      {/* ── ACT I — THE ANALYSIS ── */}
      <section className="py-16 lg:py-32 border-t border-ink-900">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">

            {/* Screenshot — top on mobile, left on desktop */}
            <div className="lg:col-span-5 flex justify-center order-first lg:order-first">
              <div className="w-full max-w-[280px]">
                <PhoneFrame
                  src="/screenshots/ext-03-match-score.png"
                  alt="JobFit extension showing your match score and hard requirements"
                  size="lg"
                />
              </div>
            </div>

            {/* Copy */}
            <div className="lg:col-span-6 lg:col-start-7">
              <p className="font-mono text-[11px] text-crimson-500 tracking-caps uppercase mb-4">№ 02 · the analysis</p>
              <h2 className="font-chunk text-[clamp(2.5rem,6vw,5rem)] leading-[0.97] tracking-tightest text-ink-900">
                open a job.<br />
                get the <span className="serif-accent text-crimson-500">truth</span>.
              </h2>
              <p className="mt-6 text-[16px] leading-relaxed text-ink-600 max-w-md">
                JobFit reads the posting, compares it semantically against your embedded resume,
                and returns a score across ten named levels — from "no fit" to "elite fit" —
                with the specific gaps you'd need to close.
              </p>
              {/* Home thumbnail */}
              <div className="mt-8 flex items-end gap-4">
                <div className="w-[90px] flex-shrink-0">
                  <PhoneFrame
                    src="/screenshots/ext-01-home.png"
                    alt="Extension home — your open roles at a glance"
                    size="sm"
                  />
                  <p className="font-mono text-[9px] text-ink-400 tracking-caps uppercase mt-2 text-center">home view</p>
                </div>
                <p className="text-[13px] text-ink-500 italic font-serif pb-2 leading-snug">
                  Your open roles,<br />at a glance.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── ACT II — THE APPLICATION ── */}
      <section className="py-16 lg:py-32 bg-ink-900 text-cream">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">

          {/* Header */}
          <div className="grid lg:grid-cols-12 gap-8 mb-12 lg:mb-16">
            <div className="lg:col-span-5">
              <p className="font-mono text-[11px] text-citrus tracking-caps uppercase mb-4">№ 03 · the application</p>
              <h2 className="font-chunk text-[clamp(2.5rem,6vw,5rem)] leading-[0.97] tracking-tightest text-cream">
                resume.<br />
                cover letter.<br />
                <span className="serif-accent text-citrus">tailored</span>.
              </h2>
            </div>
            <div className="lg:col-span-6 lg:col-start-7 pt-4">
              <p className="text-[16px] leading-relaxed text-cream/70">
                Claude Sonnet rewrites your master resume to emphasize matching experience
                and close the gaps you selected. Then it writes a cover letter that references
                the company's actual context — not a template.
              </p>
            </div>
          </div>

          {/* Two hero screenshots */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-12 justify-items-center mb-12">
            <div className="w-full max-w-[280px]">
              <PhoneFrame
                src="/screenshots/ext-04-match-resume.png"
                alt="Generated tailored resume in the JobFit extension"
                size="lg"
              />
              <p className="font-mono text-[9px] text-cream/50 tracking-caps uppercase mt-3 text-center">generated resume</p>
            </div>
            <div className="w-full max-w-[280px]">
              <PhoneFrame
                src="/screenshots/ext-09-cl-letter.png"
                alt="Generated cover letter in the JobFit extension"
                size="lg"
              />
              <p className="font-mono text-[9px] text-cream/50 tracking-caps uppercase mt-3 text-center">cover letter</p>
            </div>
          </div>

          {/* 4-screenshot strip — the full generation flow */}
          <div className="border-t border-cream/20 pt-10">
            <p className="font-mono text-[10px] text-cream/40 tracking-caps uppercase mb-8">the full flow</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-8">
              {[
                { src: '/screenshots/ext-05-resume-preview.png', label: 'resume preview' },
                { src: '/screenshots/ext-06-resume-notes.png', label: 'revision notes' },
                { src: '/screenshots/ext-07-cl-intel.png', label: 'company intel' },
                { src: '/screenshots/ext-08-cl-tone.png', label: 'tone & style' },
              ].map(({ src, label }) => (
                <div key={label} className="flex flex-col items-center">
                  <PhoneFrame src={src} alt={label} size="sm" />
                  <p className="font-mono text-[9px] text-cream/50 tracking-caps uppercase mt-2 text-center">{label}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ── ACT III — THE PLATFORM ── */}
      <section className="py-16 lg:py-32 border-t border-ink-900">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">

          {/* Header */}
          <div className="grid lg:grid-cols-12 gap-8 mb-12 lg:mb-16">
            <div className="lg:col-span-5">
              <p className="font-mono text-[11px] text-crimson-500 tracking-caps uppercase mb-4">№ 04 · the platform</p>
              <h2 className="font-chunk text-[clamp(2.5rem,6vw,5rem)] leading-[0.97] tracking-tightest text-ink-900">
                the whole<br />
                search.<br />
                <span className="serif-accent text-crimson-500">one place</span>.
              </h2>
            </div>
            <div className="lg:col-span-6 lg:col-start-7 pt-4">
              <p className="text-[16px] leading-relaxed text-ink-600">
                Edit your resume in a full-screen editor. Review every analysis. Track every
                application from first look to offer. Nothing falls through the cracks.
              </p>
            </div>
          </div>

          {/* Featured desktop screenshot */}
          <div className="mb-8">
            <BrowserFrame
              src="/screenshots/web-03-dashboard.png"
              alt="JobFit pipeline dashboard — your whole job search tracked"
            />
            <p className="font-mono text-[9px] text-ink-400 tracking-caps uppercase mt-3">pipeline dashboard</p>
          </div>

          {/* Two supporting desktop screenshots */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { src: '/screenshots/web-01-editor.png', label: 'resume editor' },
              { src: '/screenshots/web-02-history.png', label: 'analysis history' },
            ].map(({ src, label }) => (
              <div key={label}>
                <BrowserFrame src={src} alt={label} />
                <p className="font-mono text-[9px] text-ink-400 tracking-caps uppercase mt-3">{label}</p>
              </div>
            ))}
          </div>

        </div>
      </section>
    </>
  )
}
