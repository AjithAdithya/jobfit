'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bookmark, BookmarkCheck, EyeOff, ExternalLink } from 'lucide-react'
import { getMatchLevel } from '@/lib/matchLevel'

interface JobRowProps {
  jobId: string
  company: string
  jobTitle: string
  location: string | null
  locationType: string
  source: string
  roleFamily: string | null
  postedAt: string
  score: number
  confidence: string
  saved: boolean
  onHide?: (jobId: string) => void
}

function relativeDate(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400_000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

const LOCATION_PILL: Record<string, string> = {
  remote: 'bg-citrus/20 text-ink-900',
  hybrid: 'bg-sky/10 text-sky',
  onsite: 'bg-ink-100 text-ink-500',
  unknown: 'bg-ink-100 text-ink-400',
}

const SOURCE_PILL: Record<string, string> = {
  greenhouse: 'bg-ink-900/5 text-ink-500',
  lever:      'bg-sky/5 text-sky',
  ashby:      'bg-crimson-50 text-crimson-500',
  workable:   'bg-citrus/10 text-ink-700',
  rss:        'bg-ink-100 text-ink-500',
  manual:     'bg-ink-100 text-ink-500',
}

export default function JobRow({
  jobId, company, jobTitle, location, locationType, source, roleFamily,
  postedAt, score, confidence, saved, onHide,
}: JobRowProps) {
  const level = getMatchLevel(score)
  const [isSaved, setIsSaved] = useState(saved)
  const [hiding, setHiding] = useState(false)

  const toggleSave = async (e: React.MouseEvent) => {
    e.preventDefault()
    const next = !isSaved
    setIsSaved(next)
    await fetch(`/api/jobs/${jobId}/save`, { method: next ? 'POST' : 'DELETE' })
  }

  const hide = async (e: React.MouseEvent) => {
    e.preventDefault()
    setHiding(true)
    await fetch(`/api/jobs/${jobId}/hide`, { method: 'POST' })
    onHide?.(jobId)
  }

  if (hiding) return null

  return (
    <Link href={`/dashboard/jobs/${jobId}`} className="group block">
      <div className="border border-ink-200 hover:border-ink-900 transition-colors p-5 sm:p-6 flex gap-4 sm:gap-6">

        {/* Score dot */}
        <div className="shrink-0 flex flex-col items-center gap-1 pt-0.5">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: level.hex }}
            title={`${level.label} (${score}/100)`}
          />
          <span className="font-mono text-[10px] text-ink-500 num">{score}</span>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span
              className={`px-1.5 py-0.5 font-mono text-[9px] tracking-caps uppercase ${LOCATION_PILL[locationType] ?? LOCATION_PILL.unknown}`}
            >
              {locationType}
            </span>
            <span
              className={`px-1.5 py-0.5 font-mono text-[9px] tracking-caps uppercase ${SOURCE_PILL[source] ?? SOURCE_PILL.manual}`}
            >
              {source}
            </span>
            {roleFamily && (
              <span className="px-1.5 py-0.5 font-mono text-[9px] tracking-caps uppercase bg-ink-50 text-ink-400">
                {roleFamily}
              </span>
            )}
          </div>

          <p className="font-chunk text-[18px] sm:text-[22px] tracking-tight text-ink-900 leading-tight group-hover:text-crimson-500 transition-colors truncate">
            {jobTitle}
          </p>
          <p className="font-mono text-[11px] text-ink-500 mt-0.5">
            {company}
            {location && <span className="text-ink-300"> · {location}</span>}
          </p>
        </div>

        {/* Right — date + actions */}
        <div className="shrink-0 flex flex-col items-end justify-between gap-2">
          <span className="font-mono text-[10px] text-ink-400">{relativeDate(postedAt)}</span>
          <div className="flex items-center gap-2">
            {confidence === 'low' && (
              <span className="font-mono text-[9px] text-ink-300 tracking-caps uppercase">low conf.</span>
            )}
            <button
              onClick={toggleSave}
              className="p-1 text-ink-300 hover:text-ink-900 transition-colors"
              title={isSaved ? 'Unsave' : 'Save'}
            >
              {isSaved ? <BookmarkCheck className="w-4 h-4 text-citrus-600" /> : <Bookmark className="w-4 h-4" />}
            </button>
            <button
              onClick={hide}
              className="p-1 text-ink-300 hover:text-flare transition-colors"
              title="Hide"
            >
              <EyeOff className="w-4 h-4" />
            </button>
            <ExternalLink className="w-3.5 h-3.5 text-ink-200 group-hover:text-ink-400 transition-colors" />
          </div>
        </div>
      </div>
    </Link>
  )
}
