import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Check, X } from 'lucide-react'

function SectionLabel({ num, label }: { num: string; label: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="font-mono text-[11px] text-crimson-500 tracking-caps uppercase">№ {num}</span>
      <span className="h-px bg-ink-300 flex-1 max-w-[80px]" />
      <span className="font-mono text-[11px] text-ink-500 tracking-caps uppercase">{label}</span>
    </div>
  )
}

function DataRow({ stored, item, location }: { stored: boolean; item: string; location: string }) {
  return (
    <div className="flex items-start gap-3 py-4 border-b border-ink-200">
      <div className="shrink-0 mt-0.5">
        {stored ? (
          <div className="w-5 h-5 rounded-full bg-citrus flex items-center justify-center">
            <Check className="w-3 h-3 text-ink-900 stroke-[3]" />
          </div>
        ) : (
          <div className="w-5 h-5 rounded-full border border-ink-300 flex items-center justify-center">
            <X className="w-3 h-3 text-ink-400" />
          </div>
        )}
      </div>
      <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-4 min-w-0">
        <div className="flex-1 text-[15px] text-ink-900">{item}</div>
        <div className="font-mono text-[11px] text-ink-500 tracking-caps uppercase sm:text-right shrink-0">{location}</div>
      </div>
    </div>
  )
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 lg:pt-40 lg:pb-20">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-10">
          <SectionLabel num="01" label="privacy" />
          <h1 className="font-chunk text-[clamp(3rem,8vw,7rem)] leading-[0.98] tracking-tightest text-ink-900">
            your data.<br />
            <span className="serif-accent text-crimson-500">your</span> control.
          </h1>
          <p className="mt-8 max-w-2xl text-[18px] leading-relaxed text-ink-600">
            JobFit is designed from the ground up to give you full ownership of your data. Here's exactly what gets stored, where it lives, and — more importantly — what we don't collect.
          </p>
        </div>
      </section>

      {/* BYOK editorial callout */}
      <section className="py-16 border-t border-ink-900">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="border border-ink-900 bg-ink-900 text-cream p-6 sm:p-10 lg:p-14">
            <p className="font-mono text-[11px] text-citrus tracking-caps uppercase mb-6">the principle · BYOK</p>
            <h2 className="font-chunk text-[clamp(2rem,5vw,4rem)] leading-[1.05] tracking-tight mb-6">
              bring your own<br />
              <span className="serif-accent text-citrus">keys</span>. always.
            </h2>
            <p className="text-[17px] text-cream/80 leading-relaxed max-w-2xl">
              JobFit operates on a Bring Your Own Keys model. You provide your own Anthropic Claude and Voyage AI API keys. They are stored only in your browser's <span className="font-mono text-citrus bg-cream/10 px-1.5 py-0.5 rounded-sm text-[14px]">chrome.storage.local</span> — never sent to our servers, never logged, never shared. When AI calls are made, they go from your browser directly to the API provider. We are never in the loop.
            </p>
          </div>
        </div>
      </section>

      {/* Data inventory */}
      <section className="py-20 lg:py-24 border-t border-ink-900">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-10">
          <SectionLabel num="02" label="data inventory" />
          <h2 className="font-chunk text-big text-ink-900 mb-10 max-w-3xl">
            what's <span className="serif-accent text-crimson-500">stored</span>.<br />
            and where.
          </h2>

          <div className="border-t border-ink-900">
            <div className="hidden sm:flex items-center gap-4 py-3 border-b border-ink-900">
              <div className="w-5 shrink-0" />
              <div className="flex-1 font-mono text-[10px] text-ink-500 tracking-caps uppercase">data</div>
              <div className="font-mono text-[10px] text-ink-500 tracking-caps uppercase text-right">location</div>
            </div>
            <DataRow stored item="Anthropic API key" location="browser only" />
            <DataRow stored item="Voyage AI key" location="browser only" />
            <DataRow stored item="Resume text & chunks" location="your supabase" />
            <DataRow stored item="Resume embeddings (vectors)" location="your supabase · pgvector" />
            <DataRow stored item="Job analysis history" location="your supabase" />
            <DataRow stored item="Generated resumes" location="your supabase" />
            <DataRow stored item="Style presets" location="your supabase" />
            <DataRow stored item="AI token usage" location="your supabase" />
            <DataRow stored={false} item="API keys" location="never on our servers" />
            <DataRow stored={false} item="Resume or job content" location="never on our servers" />
            <DataRow stored={false} item="Usage analytics / telemetry" location="never collected" />
            <DataRow stored={false} item="Third-party trackers" location="none installed" />
          </div>
        </div>
      </section>

      {/* Supabase */}
      <section className="py-20 lg:py-24 border-t border-ink-900">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-10">
          <SectionLabel num="03" label="your supabase project" />
          <div className="grid lg:grid-cols-12 gap-10">
            <div className="lg:col-span-6">
              <h2 className="font-chunk text-big text-ink-900 mb-6">
                data namespaced to <span className="serif-accent text-crimson-500">you</span>.
              </h2>
              <p className="text-[16px] text-ink-600 leading-relaxed">
                JobFit connects to a Supabase project via the standard public credentials (<span className="font-mono text-[13px] bg-ink-100 px-1.5 py-0.5 rounded-sm">SUPABASE_URL</span> and <span className="font-mono text-[13px] bg-ink-100 px-1.5 py-0.5 rounded-sm">ANON_KEY</span>). These enforce Row Level Security — each user's data is isolated and inaccessible to anyone else, including us.
              </p>
            </div>
            <div className="lg:col-span-6 space-y-4">
              {[
                { title: 'row level security', desc: 'Every table has RLS policies. Your data is inaccessible to other users.' },
                { title: 'your namespace', desc: 'All data is namespaced to your user_id. Only you can read or write your records.' },
                { title: 'delete anytime', desc: 'Settings → Privacy → Delete All Data wipes all five tables in one click.' },
              ].map(card => (
                <div key={card.title} className="border border-ink-900 p-5 hover-shift bg-cream">
                  <h3 className="font-chunk text-[20px] tracking-tight text-ink-900 mb-2">{card.title}</h3>
                  <p className="text-[14px] text-ink-600 leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Permissions */}
      <section className="py-20 lg:py-24 border-t border-ink-900">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-10">
          <SectionLabel num="04" label="chrome permissions" />
          <h2 className="font-chunk text-big text-ink-900 mb-10 max-w-3xl">
            minimal permissions, <span className="serif-accent text-crimson-500">justified</span>.
          </h2>

          <div className="space-y-3">
            {[
              { perm: 'activeTab', reason: 'Read the current tab\'s URL and job description when you click Analyze.' },
              { perm: 'storage', reason: 'Store your API keys and session data locally. Nothing leaves your device.' },
              { perm: 'sidePanel', reason: 'Display the JobFit UI in Chrome\'s built-in side panel.' },
              { perm: 'identity', reason: 'Used for Google OAuth sign-in via Supabase.' },
            ].map(p => (
              <div key={p.perm} className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6 py-4 border-b border-ink-200">
                <div className="sm:w-40 shrink-0">
                  <code className="font-mono text-[13px] text-crimson-500 bg-crimson-50 px-2 py-1 rounded-sm">{p.perm}</code>
                </div>
                <div className="flex-1 text-[15px] text-ink-700">{p.reason}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Delete */}
      <section className="py-20 lg:py-24 border-t border-ink-900 bg-ink-900 text-cream">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex items-center gap-3 mb-6">
            <span className="font-mono text-[11px] text-citrus tracking-caps uppercase">№ 05</span>
            <span className="h-px bg-cream/30 flex-1 max-w-[80px]" />
            <span className="font-mono text-[11px] text-cream/60 tracking-caps uppercase">the exit</span>
          </div>
          <h2 className="font-chunk text-big text-cream mb-6 max-w-3xl">
            delete it all. <span className="serif-accent text-citrus">one click</span>.
          </h2>
          <p className="max-w-2xl text-[17px] text-cream/80 leading-relaxed">
            Settings → Privacy → <span className="font-mono text-citrus">Delete All Data</span> permanently removes every record from <code className="font-mono text-[13px] bg-cream/10 px-1 rounded-sm">resumes</code>, <code className="font-mono text-[13px] bg-cream/10 px-1 rounded-sm">resume_chunkies</code>, <code className="font-mono text-[13px] bg-cream/10 px-1 rounded-sm">analysis_history</code>, <code className="font-mono text-[13px] bg-cream/10 px-1 rounded-sm">style_presets</code>, and <code className="font-mono text-[13px] bg-cream/10 px-1 rounded-sm">generations</code> — then signs you out and clears local storage. No tickets, no appeals, no retention.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-10 text-center">
          <p className="font-mono text-[10px] text-ink-400 tracking-caps uppercase">
            last updated · {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </section>

      <Footer />
    </div>
  )
}
