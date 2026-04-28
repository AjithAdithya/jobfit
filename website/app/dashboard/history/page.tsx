import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

function scoreColor(score: number) {
  if (score >= 70) return 'text-emerald-600'
  if (score >= 45) return 'text-amber-500'
  return 'text-crimson-500'
}

export default async function HistoryPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: history } = await supabase
    .from('analysis_history')
    .select('id, job_title, company_name, score, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const rows = history ?? []
  const avgScore = rows.length
    ? Math.round(rows.reduce((s, r) => s + (r.score ?? 0), 0) / rows.length)
    : null

  return (
    <div className="max-w-4xl mx-auto px-6">
      <div className="flex items-baseline justify-between mb-8">
        <h1 className="font-chunk text-3xl text-ink-900">history</h1>
        {avgScore !== null && (
          <span className="text-ink-500 text-[15px]">avg score <strong className="text-ink-900">{avgScore}</strong></span>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="border border-dashed border-ink-300 rounded-xl p-16 text-center text-ink-400 text-[15px]">
          No analyses yet. Analyze a job from the extension or paste one from the dashboard.
        </div>
      ) : (
        <div className="divide-y divide-ink-100 border border-ink-200 rounded-xl overflow-hidden">
          {rows.map(row => (
            <Link
              key={row.id}
              href={`/dashboard/history/${row.id}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-ink-50 transition-colors group"
            >
              <span className={`font-chunk text-2xl w-12 shrink-0 ${scoreColor(row.score ?? 0)}`}>
                {row.score ?? '—'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] text-ink-900 truncate">{row.job_title ?? 'Untitled'}</p>
                {row.company_name && (
                  <p className="text-[13px] text-ink-400 truncate">{row.company_name}</p>
                )}
              </div>
              <div className="hidden sm:flex items-center gap-3 shrink-0">
                {row.status && (
                  <span className="text-[12px] px-2 py-0.5 rounded-full bg-ink-100 text-ink-500 capitalize">
                    {row.status}
                  </span>
                )}
                <span className="text-[13px] text-ink-400">
                  {new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
              <span className="text-ink-300 group-hover:text-ink-500 transition-colors">→</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
