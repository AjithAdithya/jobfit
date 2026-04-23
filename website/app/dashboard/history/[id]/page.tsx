import { createClient } from '@/lib/supabase/server'
import { getMatchLevel } from '@/lib/matchLevel'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Target, Zap, Sparkles, CheckCircle2,
  Briefcase, Clock, ExternalLink, FileText, Download
} from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  Evaluating: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  Applied: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Interviewing: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Offer: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Rejected: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
}

export default async function HistoryDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: item } = await supabase
    .from('analysis_history')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!item) notFound()

  const level = getMatchLevel(item.score)
  const matches: string[] = item.matches || []
  const gaps: string[] = item.gaps || []
  const keywords: string[] = item.keywords || []
  const selectedGaps: string[] = item.selected_gaps || []
  const selectedKeywords: string[] = item.selected_keywords || []

  const circumference = 2 * Math.PI * 44
  const offset = circumference - (item.score / 100) * circumference

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
      {/* Back */}
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-colors mb-8">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      {/* Job header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white mb-1">{item.job_title}</h1>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Briefcase className="w-4 h-4" />
            <span>{item.site_name}</span>
            <span>·</span>
            <Clock className="w-4 h-4" />
            <span>{new Date(item.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          {item.job_url && (
            <a href={item.job_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 mt-2 transition-colors">
              View job posting <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border flex-shrink-0 ${STATUS_COLORS[item.status] || STATUS_COLORS.Evaluating}`}>
          {item.status}
        </span>
      </div>

      {/* Match card */}
      <div className={`p-8 bg-gradient-to-br ${level.cardBg} border ${level.cardBorder} rounded-[2.5rem] flex items-center justify-between mb-6 relative overflow-hidden`}>
        <div className={`absolute -bottom-10 -left-10 w-40 h-40 ${level.glowClass} rounded-full blur-[80px] opacity-10`} />
        <div className="relative z-10">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Job Compatibility</p>
          <h2 className={`text-3xl font-black ${level.textClass}`}>{level.label}</h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">{level.subtitle}</p>
        </div>
        {/* Score circle */}
        <div className="relative w-24 h-24 flex items-center justify-center flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-800" />
            <circle
              cx="50" cy="50" r="44"
              stroke={`url(#grad-${item.id})`}
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              fill="transparent"
            />
            <defs>
              <linearGradient id={`grad-${item.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={level.gradientFrom} />
                <stop offset="100%" stopColor={level.gradientTo} />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-white leading-none">{item.score}</span>
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Fit %</span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Matching Strengths */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-3">
            <Target className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">Matching Strengths</span>
            <span className="text-2xl font-black text-emerald-400 leading-none">{matches.length}</span>
            <span className="text-slate-600 text-sm">/</span>
            <span className="text-base font-black text-slate-500">{matches.length + gaps.length}</span>
          </div>
          <div className="p-4 space-y-2">
            {matches.map((m, i) => (
              <div key={i} className="flex items-start gap-2.5 p-3 bg-slate-950/50 rounded-2xl border border-slate-800/50">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <p className="text-xs text-slate-300 font-medium leading-relaxed">{m}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Gaps */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-3">
            <Zap className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-black text-blue-400 uppercase tracking-widest">Gaps</span>
            <span className="text-[10px] text-slate-500 font-bold">
              {selectedGaps.length} addressed / {gaps.length} total
            </span>
          </div>
          <div className="p-4 space-y-2">
            {gaps.map((g, i) => (
              <div key={i} className={`flex items-start gap-2.5 p-3 rounded-2xl border ${selectedGaps.includes(g) ? 'bg-blue-500/5 border-blue-500/20' : 'bg-slate-950/50 border-slate-800/50'}`}>
                <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 ${selectedGaps.includes(g) ? 'bg-blue-600 border-blue-600' : 'border-slate-700'}`}>
                  {selectedGaps.includes(g) && <CheckCircle2 className="w-3 h-3 text-white" />}
                </div>
                <p className="text-xs text-slate-300 font-medium leading-relaxed">{g}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Keywords */}
      {keywords.length > 0 && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-5 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-black text-amber-400 uppercase tracking-widest">Target Keywords</span>
            <span className="text-[10px] text-slate-500 font-bold">{selectedKeywords.length}/{keywords.length} selected</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {keywords.map((k, i) => (
              <span
                key={i}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border ${selectedKeywords.includes(k)
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : 'bg-slate-950 border-slate-700 text-slate-500'
                }`}
              >
                {k}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Generated Resume */}
      {item.generated_resume && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">Generated Resume</span>
            </div>
            <span className="text-[10px] text-slate-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full text-emerald-400 font-bold">Available</span>
          </div>
          <p className="text-xs text-slate-400 mb-4">Your AI-tailored resume for this role is saved and ready. Download it from the extension to get the formatted DOCX file.</p>
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
            <div
              className="text-xs text-slate-400 max-h-48 overflow-hidden relative"
              dangerouslySetInnerHTML={{ __html: item.generated_resume }}
            />
            <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-slate-950 to-transparent rounded-b-2xl pointer-events-none" />
          </div>
          <p className="text-xs text-slate-600 mt-3 text-center">Download the full DOCX from the extension's Activity Log → Get Resume</p>
        </div>
      )}

      {/* Cover Letter */}
      {item.cover_letter && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-black text-purple-400 uppercase tracking-widest">Cover Letter</span>
            {item.cover_letter_tone && (
              <span className="text-[10px] text-slate-500 font-bold capitalize">{item.cover_letter_tone} tone</span>
            )}
          </div>
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-400 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
            {item.cover_letter}
          </div>
        </div>
      )}
    </div>
  )
}
