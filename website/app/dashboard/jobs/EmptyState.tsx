import Link from 'next/link'

type EmptyReason = 'no_prefs' | 'no_scores' | 'filtered'

interface Props { reason: EmptyReason }

const COPY: Record<EmptyReason, { headline: string; body: string; cta?: { href: string; label: string } }> = {
  no_prefs: {
    headline: 'set up your job preferences.',
    body: 'tell us your target roles, locations, and which resume you\'re using — then we\'ll score every new posting overnight.',
    cta: { href: '/dashboard/jobs/preferences', label: 'set preferences →' },
  },
  no_scores: {
    headline: 'scoring in progress.',
    body: 'your feed is being built. we run scoring nightly — check back tomorrow for your ranked list.',
    cta: { href: '/dashboard/jobs/preferences', label: 'review preferences →' },
  },
  filtered: {
    headline: 'no matches.',
    body: 'nothing fits your current filters. try widening the score band or clearing the location filter.',
  },
}

export default function EmptyState({ reason }: Props) {
  const { headline, body, cta } = COPY[reason]

  return (
    <div className="border border-dashed border-ink-200 p-10 sm:p-16 text-center">
      <p className="font-mono text-[10px] text-ink-400 tracking-caps uppercase mb-4">no results</p>
      <h2 className="font-chunk text-[clamp(1.5rem,4vw,2.5rem)] text-ink-900 tracking-tight leading-tight mb-4">
        {headline}
      </h2>
      <p className="font-serif italic text-[14px] text-ink-500 max-w-md mx-auto mb-6">{body}</p>
      {cta && (
        <Link
          href={cta.href}
          className="inline-block px-6 py-3 border border-ink-900 font-mono text-[11px] tracking-caps uppercase text-ink-900 hover:bg-ink-900 hover:text-cream transition-colors"
        >
          {cta.label}
        </Link>
      )}
    </div>
  )
}
