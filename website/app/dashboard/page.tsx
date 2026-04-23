import { createClient } from '@/lib/supabase/server'
import { getMatchLevel } from '@/lib/matchLevel'
import Link from 'next/link'
import {
  Target, Briefcase, Clock, History, FileText,
  TrendingUp, Zap, Download, ChevronRight
} from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  Evaluating: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  Applied: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Interviewing: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Offer: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Rejected: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
}

async function getStats(userId: string, supabase: ReturnType<typeof createClient>) {
  const { data: history } = await supabase
    .from('analysis_history')
    .select('id, job_title, job_url, site_name, score, status, created_at, generated_resume')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  const { data: resumes } = await supabase
    .from('resumes')
    .select('id')
    .eq('user_id', userId)

  const items = history || []
  const avgScore = items.length > 0
    ? Math.round(items.reduce((a, c) => a + c.score, 0) / items.length)
    : 0

  const statusCounts = items.reduce((acc: Record<string, number>, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1
    return acc
  }, {})

  return { items, avgScore, statusCounts, resumeCount: resumes?.length || 0 }
}

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { items, avgScore, statusCounts, resumeCount } = await getStats(user.id, supabase)
  const recent = items.slice(0, 10)

  const name = user.user_metadata?.full_name?.split(' ')[0] || 'there'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Dashboard</p>
          <h1 className="text-3xl font-black text-white">Hey, {name} 👋</h1>
          <p className="text-slate-400 mt-1">Here's your job search at a glance.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Synced from extension
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-5 bg-gradient-to-br from-blue-600/10 to-transparent border border-blue-500/20 rounded-3xl">
          <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Jobs Analyzed</p>
          <p className="text-4xl font-black text-white">{items.length}</p>
        </div>
        <div className="p-5 bg-gradient-to-br from-emerald-600/10 to-transparent border border-emerald-500/20 rounded-3xl">
          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Avg Match Score</p>
          <div className="flex items-end gap-1">
            <p className="text-4xl font-black text-white">{avgScore}</p>
            <p className="text-slate-500 font-bold mb-1">/100</p>
          </div>
        </div>
        <div className="p-5 bg-gradient-to-br from-purple-600/10 to-transparent border border-purple-500/20 rounded-3xl">
          <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2">Interviewing</p>
          <p className="text-4xl font-black text-white">{statusCounts.Interviewing || 0}</p>
        </div>
        <div className="p-5 bg-gradient-to-br from-amber-600/10 to-transparent border border-amber-500/20 rounded-3xl">
          <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-2">Resumes in Vault</p>
          <p className="text-4xl font-black text-white">{resumeCount}</p>
        </div>
      </div>

      {/* Pipeline view */}
      {items.length > 0 && (
        <div className="mb-8 p-5 bg-slate-900/50 border border-slate-800 rounded-3xl">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Pipeline</p>
          <div className="flex items-center gap-2 flex-wrap">
            {['Evaluating', 'Applied', 'Interviewing', 'Offer', 'Rejected'].map((status, i, arr) => (
              <div key={status} className="flex items-center gap-2">
                <div className={`px-4 py-2 rounded-2xl border text-xs font-black uppercase tracking-widest ${STATUS_COLORS[status]}`}>
                  {statusCounts[status] || 0} {status}
                </div>
                {i < arr.length - 1 && <ChevronRight className="w-4 h-4 text-slate-700 flex-shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <History className="w-5 h-5 text-blue-400" /> Recent Activity
          </h2>
          <span className="text-xs font-bold text-slate-500 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
            {items.length} total
          </span>
        </div>

        {items.length === 0 ? (
          <div className="py-20 flex flex-col items-center text-center space-y-4 bg-slate-900/50 border border-slate-800 border-dashed rounded-[2rem]">
            <History className="w-10 h-10 text-slate-600" />
            <div className="space-y-1">
              <h3 className="font-bold text-white">No history yet</h3>
              <p className="text-xs text-slate-500">Install the extension and analyze your first job.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {recent.map(item => {
              const level = getMatchLevel(item.score)
              return (
                <Link
                  key={item.id}
                  href={`/dashboard/history/${item.id}`}
                  className="block p-5 bg-slate-900 border border-slate-800 rounded-[2rem] hover:border-slate-700 transition-colors group relative overflow-hidden"
                >
                  <div className={`absolute -right-10 -top-10 w-28 h-28 ${level.glowClass} rounded-full blur-[60px] opacity-10`} />
                  <div className="relative z-10 flex items-center gap-4">
                    {/* Score */}
                    <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 border ${level.cardBorder} bg-gradient-to-br ${level.cardBg}`}>
                      <span className={`text-xl font-black ${level.textClass} leading-none`}>{item.score}</span>
                      <span className="text-[8px] text-slate-500 uppercase tracking-tighter">fit%</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-white truncate">{item.job_title}</h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <Briefcase className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{item.site_name}</span>
                        <span>·</span>
                        <Clock className="w-3 h-3 flex-shrink-0" />
                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className={`text-xs font-bold mt-1 ${level.textClass}`}>{level.label}</p>
                    </div>

                    {/* Status + actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {item.generated_resume && (
                        <div className="w-7 h-7 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                          <FileText className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                      )}
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${STATUS_COLORS[item.status] || STATUS_COLORS.Evaluating}`}>
                        {item.status}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
