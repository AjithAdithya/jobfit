import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowUpRight, Pencil } from 'lucide-react'
import StatusDropdown from '@/components/StatusDropdown'
import HistoryDetailClient from '@/components/HistoryDetailClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

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

  // Fetch all versions for right panel (server-side to avoid extra round-trip)
  const { data: versions } = await supabase
    .from('resume_versions')
    .select('id, version_number, revision_note, source, created_at, latex, is_selected')
    .eq('analysis_history_id', item.id)
    .eq('user_id', user.id)
    .order('version_number', { ascending: false })

  const allVersions = versions ?? []

  // Determine initial centre content: selected version → latest version → generated_resume
  const initialVersion = allVersions.find(v => v.is_selected) ?? allVersions[0] ?? null
  const initialViewLatex = initialVersion?.latex ?? item.generated_resume ?? null
  const initialViewVersionId = initialVersion?.id ?? null

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">

      {/* Compact header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6 pb-5 border-b border-ink-200">
        <div className="min-w-0">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-[12px] text-ink-400 hover:text-ink-900 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> dashboard
          </Link>
          <p className="font-mono text-[10px] text-ink-400 tracking-caps uppercase mb-1">
            {new Date(item.created_at).toLocaleDateString('en-US', {
              month: 'short', day: '2-digit', year: 'numeric',
            })}
            {item.site_name ? ` · ${item.site_name}` : ''}
          </p>
          <h1 className="font-chunk text-[clamp(1.5rem,3vw,2rem)] tracking-tight text-ink-900 leading-tight break-words">
            {item.job_title}
          </h1>
          {item.job_url && (
            <a
              href={item.job_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[12px] text-ink-400 hover:text-crimson-500 mt-1 transition-colors"
            >
              view posting <ArrowUpRight className="w-3 h-3" />
            </a>
          )}
        </div>
        <div className="flex items-center sm:flex-col sm:items-end gap-2 shrink-0">
          <StatusDropdown id={item.id} initial={item.status} />
          {item.generated_resume && (
            <Link
              href={`/dashboard/history/${item.id}/edit`}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-ink-900 text-cream font-mono text-[10px] tracking-caps uppercase hover:bg-crimson-500 transition-colors whitespace-nowrap"
            >
              <Pencil className="w-3 h-3" /> editor
            </Link>
          )}
        </div>
      </div>

      <HistoryDetailClient
        historyId={item.id}
        score={item.score}
        matches={item.matches || []}
        gaps={item.gaps || []}
        selectedGaps={item.selected_gaps || []}
        keywords={item.keywords || []}
        selectedKeywords={item.selected_keywords || []}
        hardRequirements={item.hard_requirements || []}
        coverLetter={item.cover_letter ?? null}
        coverLetterTone={item.cover_letter_tone ?? null}
        initialViewLatex={initialViewLatex}
        initialViewVersionId={initialViewVersionId}
        initialVersions={allVersions}
      />
    </div>
  )
}
