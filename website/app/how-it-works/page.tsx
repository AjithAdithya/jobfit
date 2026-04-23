import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Database, Brain, FileText, Cpu, ArrowDown, ArrowRight, Shield, Zap, Key, Cloud, Download } from 'lucide-react'

function FlowStep({ icon: Icon, title, desc, color, badge }: {
  icon: React.ElementType; title: string; desc: string; color: string; badge?: string
}) {
  return (
    <div className="relative">
      <div className={`p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-3 hover:border-slate-700 transition-colors`}>
        {badge && (
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">{badge}</span>
        )}
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <h3 className="font-black text-white">{title}</h3>
        <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

function Connector({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 py-2">
      <ArrowDown className="w-4 h-4 text-slate-600" />
      {label && <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">{label}</span>}
    </div>
  )
}

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />

      <div className="pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center mb-20 space-y-4">
            <p className="text-xs font-black text-cyan-400 uppercase tracking-widest">Architecture</p>
            <h1 className="text-5xl font-black text-white">How JobFit AI works</h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">A multi-agent AI pipeline running entirely in your browser, backed by your own Supabase and API keys.</p>
          </div>

          {/* ── System Overview ── */}
          <section className="mb-24">
            <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-[2.5rem] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/3 rounded-full blur-3xl" />
              <div className="relative z-10">
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">System overview</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { icon: Key, label: 'Your API Keys', sub: 'Anthropic + Voyage AI\nStored in browser only', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
                    { icon: Database, label: 'Your Supabase', sub: 'PostgreSQL + pgvector\nResumes, history, styles', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
                    { icon: Brain, label: 'Claude AI', sub: 'Haiku for analysis\nSonnet for generation', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
                    { icon: Cloud, label: 'Voyage AI', sub: 'resume-2 model\nSemantic embeddings', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
                  ].map(({ icon: Icon, label, sub, color, bg }) => (
                    <div key={label} className={`p-4 border rounded-2xl ${bg}`}>
                      <Icon className={`w-6 h-6 ${color} mb-3`} />
                      <p className={`text-sm font-black ${color}`}>{label}</p>
                      <p className="text-xs text-slate-500 mt-1 whitespace-pre-line">{sub}</p>
                    </div>
                  ))}
                </div>

                {/* Connection lines */}
                <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
                  {['Extension (MV3)', '→', 'Supabase Auth', '→', 'AI Agents', '→', 'Resume Output'].map((item, i) => (
                    <span key={i} className={`text-sm font-bold ${item === '→' ? 'text-slate-700' : 'text-slate-400 bg-slate-800 px-3 py-1 rounded-xl'}`}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── Two flows side by side ── */}
          <div className="grid md:grid-cols-2 gap-8 mb-24">

            {/* Resume ingestion flow */}
            <div>
              <div className="mb-6">
                <p className="text-xs font-black text-blue-400 uppercase tracking-widest mb-1">Flow 1</p>
                <h2 className="text-2xl font-black text-white">Resume Ingestion</h2>
                <p className="text-sm text-slate-400 mt-1">Runs once when you upload your base resume</p>
              </div>
              <div className="space-y-2">
                <FlowStep icon={FileText} color="bg-blue-600" badge="User action" title="Upload PDF" desc="You upload your resume PDF via the extension's Vault tab. Max 5 MB." />
                <Connector label="extract text" />
                <FlowStep icon={Cpu} color="bg-slate-700" title="PDF Parsing" desc="pdfjs-dist extracts text and font metadata from the PDF in-browser." />
                <Connector label="vectorize" />
                <FlowStep icon={Cloud} color="bg-cyan-600" title="Voyage Embeddings" desc="Resume text is chunked and sent to Voyage AI's resume-2 model for high-quality embeddings." />
                <Connector label="store" />
                <FlowStep icon={Database} color="bg-blue-700" title="Supabase pgvector" desc="Embeddings stored in your Supabase project's resume_chunkies table with pgvector extension." />
              </div>
            </div>

            {/* Analysis + Generation flow */}
            <div>
              <div className="mb-6">
                <p className="text-xs font-black text-purple-400 uppercase tracking-widest mb-1">Flow 2</p>
                <h2 className="text-2xl font-black text-white">Analysis & Generation</h2>
                <p className="text-sm text-slate-400 mt-1">Runs each time you analyze a job description</p>
              </div>
              <div className="space-y-2">
                <FlowStep icon={Zap} color="bg-amber-600" badge="User action" title="Click Analyze" desc="You open a job posting in Chrome and click the JobFit toolbar icon." />
                <Connector label="scrape + vectorize" />
                <FlowStep icon={Brain} color="bg-purple-600" title="Match Analysis Agent" desc="Claude Haiku compares your resume embeddings to the job description via cosine similarity in pgvector." />
                <Connector label="score + gaps" />
                <FlowStep icon={FileText} color="bg-emerald-600" title="Resume Generation Agent" desc="Claude Sonnet rewrites your resume using matched context, selected gaps, and your chosen style preset." />
                <Connector label="enforce A4" />
                <FlowStep icon={Download} color="bg-slate-700" title="DOCX Output" desc="Generated HTML is style-fitted to one A4 page and exported as a Word document." />
              </div>
            </div>
          </div>

          {/* ── AI Agents breakdown ── */}
          <section className="mb-24">
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Multi-agent system</p>
            <h2 className="text-3xl font-black text-white mb-8">Specialized agents, each with one job</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: 'Analyzer Agent', model: 'Claude Haiku', desc: 'Reads job description and resume chunks, computes match score, extracts strengths, gaps, and keywords.', color: 'text-purple-400', border: 'border-purple-500/20', bg: 'bg-purple-500/5' },
                { name: 'Resume Writer Agent', model: 'Claude Sonnet', desc: 'Full resume rewrite targeting the specific job. Uses selected gaps and keywords as hard requirements.', color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/5' },
                { name: 'Cover Letter Agent', model: 'Claude Sonnet', desc: 'Tone-aware cover letter generation (Professional, Casual, Enthusiastic). Uses full job + resume context.', color: 'text-blue-400', border: 'border-blue-500/20', bg: 'bg-blue-500/5' },
                { name: 'Stylist Agent', model: 'Claude Haiku', desc: 'Converts a plain-English style description into a structured ResumeStyle JSON object.', color: 'text-amber-400', border: 'border-amber-500/20', bg: 'bg-amber-500/5' },
                { name: 'Style Extractor Agent', model: 'Claude Haiku', desc: 'Reads font, size, spacing metadata from a template PDF and produces a matching ResumeStyle.', color: 'text-cyan-400', border: 'border-cyan-500/20', bg: 'bg-cyan-500/5' },
                { name: 'Embedding Pipeline', model: 'Voyage resume-2', desc: 'Not an LLM agent — chunks your resume and creates dense semantic vectors for similarity search.', color: 'text-slate-400', border: 'border-slate-600/20', bg: 'bg-slate-600/5' },
              ].map(agent => (
                <div key={agent.name} className={`p-5 border ${agent.border} ${agent.bg} rounded-2xl space-y-2`}>
                  <p className={`text-xs font-black ${agent.color} uppercase tracking-widest`}>{agent.name}</p>
                  <p className="text-[10px] text-slate-500 font-bold bg-slate-800 px-2 py-0.5 rounded-full w-fit">{agent.model}</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{agent.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Data privacy architecture ── */}
          <section className="p-8 bg-slate-900/40 border border-emerald-500/10 rounded-[2.5rem]">
            <div className="flex items-center gap-3 mb-8">
              <Shield className="w-6 h-6 text-emerald-400" />
              <h2 className="text-2xl font-black text-white">Privacy by architecture</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <p className="text-xs font-black text-emerald-400 uppercase tracking-widest">In your browser only</p>
                <ul className="space-y-1.5 text-sm text-slate-400">
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />Anthropic API key</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />Voyage AI key</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />AI calls (direct browser → API)</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />chrome.storage.local session</li>
                </ul>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-black text-blue-400 uppercase tracking-widest">In your Supabase</p>
                <ul className="space-y-1.5 text-sm text-slate-400">
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />Resume text & embeddings</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />Analysis history</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />Generated resumes & cover letters</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />Style presets</li>
                </ul>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-black text-rose-400 uppercase tracking-widest">Never collected by us</p>
                <ul className="space-y-1.5 text-sm text-slate-400">
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />API keys</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />Resume content</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />Job descriptions you analyze</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />Usage analytics or telemetry</li>
                </ul>
              </div>
            </div>
          </section>

        </div>
      </div>

      <Footer />
    </div>
  )
}
