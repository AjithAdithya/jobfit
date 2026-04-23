import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Shield, Key, Database, Lock, Trash2, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="py-12 border-t border-slate-800/60">
      <h2 className="text-2xl font-black text-white mb-6">{title}</h2>
      {children}
    </section>
  )
}

function DataRow({ stored, item, location }: { stored: boolean; item: string; location: string }) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-slate-800/40 last:border-0">
      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${stored ? 'bg-blue-500/20' : 'bg-slate-800'}`}>
        {stored ? <CheckCircle2 className="w-3 h-3 text-blue-400" /> : <EyeOff className="w-3 h-3 text-slate-600" />}
      </div>
      <span className="text-sm text-slate-300 flex-1">{item}</span>
      <span className={`text-xs font-bold ${stored ? 'text-blue-400' : 'text-slate-600'}`}>{location}</span>
    </div>
  )
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />

      <div className="pt-32 pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">Privacy First</span>
            </div>
            <h1 className="text-5xl font-black text-white">Your data. Your control.</h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">JobFit AI is designed from the ground up to give you full ownership and control of your data. Here's exactly what we collect, store, and — more importantly — what we don't.</p>
          </div>

          {/* BYOK hero callout */}
          <div className="p-8 bg-gradient-to-br from-amber-600/5 to-orange-600/5 border border-amber-500/15 rounded-[2rem] mb-12">
            <div className="flex gap-4">
              <Key className="w-8 h-8 text-amber-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-black text-white mb-2">Bring Your Own Keys (BYOK)</h2>
                <p className="text-slate-400 leading-relaxed">
                  JobFit operates on a Bring Your Own Keys model. You provide your own Anthropic Claude API key and Voyage AI API key. These keys are stored <strong className="text-white">only in your browser's <code className="text-amber-300">chrome.storage.local</code></strong> — they are never sent to our servers, never logged, and never shared. When AI calls are made, they go directly from your browser to the API provider. We are never in the loop.
                </p>
              </div>
            </div>
          </div>

          {/* Data inventory */}
          <Section title="What's stored and where">
            <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-3xl">
              <div className="grid grid-cols-3 gap-2 pb-3 mb-3 border-b border-slate-800">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Data</span>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest col-span-2">Location</span>
              </div>
              <DataRow stored item="Anthropic API key" location="Browser only (chrome.storage.local)" />
              <DataRow stored item="Voyage AI key" location="Browser only (chrome.storage.local)" />
              <DataRow stored item="Resume text & chunks" location="Your Supabase project (resumes table)" />
              <DataRow stored item="Resume embeddings (vectors)" location="Your Supabase project (pgvector)" />
              <DataRow stored item="Job analysis history" location="Your Supabase project (analysis_history)" />
              <DataRow stored item="Generated resumes" location="Your Supabase project (analysis_history)" />
              <DataRow stored item="Style presets" location="Your Supabase project (style_presets)" />
              <DataRow stored item="AI token usage" location="Your Supabase project (generations)" />
              <DataRow stored={false} item="API keys" location="Never on our servers" />
              <DataRow stored={false} item="Resume or job content" location="Never on our servers" />
              <DataRow stored={false} item="Analytics or usage telemetry" location="Never collected" />
              <DataRow stored={false} item="Third-party trackers" location="None installed" />
            </div>
          </Section>

          {/* Supabase project */}
          <Section title="Your Supabase project">
            <div className="space-y-4">
              <p className="text-slate-400 leading-relaxed">
                JobFit connects to a Supabase project. The credentials used (<code className="text-blue-300 text-sm bg-slate-800 px-1.5 py-0.5 rounded">SUPABASE_URL</code> and <code className="text-blue-300 text-sm bg-slate-800 px-1.5 py-0.5 rounded">SUPABASE_ANON_KEY</code>) are the standard public credentials — they enforce Row Level Security (RLS), so each user's data is isolated and only accessible to them when authenticated.
              </p>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { icon: Lock, title: 'Row Level Security', desc: 'Every table has RLS policies. Your data is inaccessible to other users.' },
                  { icon: Database, title: 'Your namespace', desc: 'All data is namespaced to your user_id. Only you can read or write your records.' },
                  { icon: Trash2, title: 'Delete anytime', desc: 'The Settings page includes a one-click "Delete All Data" that wipes all 5 tables.' },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                    <Icon className="w-5 h-5 text-blue-400" />
                    <p className="font-black text-white text-sm">{title}</p>
                    <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* AI API calls */}
          <Section title="AI API calls">
            <div className="space-y-4">
              <p className="text-slate-400 leading-relaxed">
                All AI API calls (to Anthropic Claude and Voyage AI) are made directly from your browser using your API keys. The extension uses the <code className="text-purple-300 text-sm bg-slate-800 px-1.5 py-0.5 rounded">anthropic-dangerous-direct-browser-access: true</code> header which Anthropic provides for extensions. This means:
              </p>
              <div className="space-y-3">
                {[
                  { icon: CheckCircle2, color: 'text-emerald-400', text: 'AI calls go: Your Browser → Anthropic/Voyage directly' },
                  { icon: CheckCircle2, color: 'text-emerald-400', text: 'We never proxy, log, or intercept AI requests' },
                  { icon: CheckCircle2, color: 'text-emerald-400', text: 'Your resume content is sent only to the AI provider you choose' },
                  { icon: AlertCircle, color: 'text-amber-400', text: 'AI providers (Anthropic, Voyage) have their own privacy policies for API data' },
                ].map(({ icon: Icon, color, text }, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-slate-300">
                    <Icon className={`w-4 h-4 ${color} shrink-0 mt-0.5`} />
                    {text}
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* Chrome extension permissions */}
          <Section title="Chrome extension permissions">
            <div className="space-y-3">
              {[
                { perm: 'activeTab', reason: 'Read the current tab\'s URL and job description text when you click Analyze.' },
                { perm: 'storage', reason: 'Store your API keys and session data locally in your browser. Nothing leaves your device.' },
                { perm: 'sidePanel', reason: 'Display the JobFit UI in Chrome\'s built-in side panel.' },
                { perm: 'identity', reason: 'Used for Google OAuth sign-in via Supabase.' },
              ].map(({ perm, reason }) => (
                <div key={perm} className="flex gap-4 p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                  <code className="text-xs font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded flex-shrink-0 h-fit">{perm}</code>
                  <p className="text-sm text-slate-400">{reason}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* Delete data */}
          <Section title="Deleting your data">
            <div className="p-6 bg-rose-500/5 border border-rose-500/15 rounded-3xl space-y-3">
              <Trash2 className="w-6 h-6 text-rose-400" />
              <p className="font-black text-white">Full data deletion is one click away</p>
              <p className="text-sm text-slate-400 leading-relaxed">
                In the extension's Settings → Privacy section, the "Delete All Data" button permanently removes all records from <code className="text-slate-300 bg-slate-800 px-1 rounded">resumes</code>, <code className="text-slate-300 bg-slate-800 px-1 rounded">resume_chunkies</code>, <code className="text-slate-300 bg-slate-800 px-1 rounded">analysis_history</code>, <code className="text-slate-300 bg-slate-800 px-1 rounded">style_presets</code>, and <code className="text-slate-300 bg-slate-800 px-1 rounded">generations</code> — then signs you out and clears local storage.
              </p>
            </div>
          </Section>

          {/* Contact */}
          <Section title="Questions?">
            <p className="text-slate-400">This is an open-source project. You can inspect exactly how data is handled by reading the source code. Have a concern or question? Open an issue on GitHub.</p>
          </Section>

          <p className="text-xs text-slate-600 text-center pt-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        </div>
      </div>

      <Footer />
    </div>
  )
}
