'use client'

import { useState, useCallback } from 'react'
import JobRow from './JobRow'
import EmptyState from './EmptyState'

interface JobEntry {
  job_id: string
  company: string
  job_title: string
  location: string | null
  location_type: string
  source: string
  role_family: string | null
  posted_at: string
  score: number
  confidence: string
  saved: boolean
}

interface Props {
  initialJobs: JobEntry[]
  hasPrefs: boolean
  searchParams: Record<string, string>
}

export default function JobsFeedClient({ initialJobs, hasPrefs, searchParams }: Props) {
  const [jobs, setJobs] = useState<JobEntry[]>(initialJobs)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialJobs.length === 25)
  const [offset, setOffset] = useState(initialJobs.length)

  const handleHide = useCallback((jobId: string) => {
    setJobs(prev => prev.filter(j => j.job_id !== jobId))
  }, [])

  const loadMore = async () => {
    if (loading || !hasMore) return
    setLoading(true)

    const params = new URLSearchParams(searchParams)
    params.set('offset', String(offset))
    params.set('limit', '25')

    try {
      const res = await fetch(`/api/jobs?${params.toString()}`)
      const { jobs: more } = await res.json()
      if (!more || more.length === 0) {
        setHasMore(false)
      } else {
        setJobs(prev => [...prev, ...more])
        setOffset(o => o + more.length)
        if (more.length < 25) setHasMore(false)
      }
    } finally {
      setLoading(false)
    }
  }

  if (!hasPrefs) return <EmptyState reason="no_prefs" />
  if (jobs.length === 0) {
    const hasFilters = Object.values(searchParams).some(Boolean)
    return <EmptyState reason={hasFilters ? 'filtered' : 'no_scores'} />
  }

  return (
    <div>
      <div className="space-y-2">
        {jobs.map(job => (
          <JobRow
            key={job.job_id}
            jobId={job.job_id}
            company={job.company}
            jobTitle={job.job_title}
            location={job.location}
            locationType={job.location_type}
            source={job.source}
            roleFamily={job.role_family}
            postedAt={job.posted_at}
            score={job.score}
            confidence={job.confidence}
            saved={job.saved}
            onHide={handleHide}
          />
        ))}
      </div>

      {hasMore && (
        <div className="mt-8 text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-3 border border-ink-900 font-mono text-[11px] tracking-caps uppercase text-ink-900 hover:bg-ink-900 hover:text-cream transition-colors disabled:opacity-50"
          >
            {loading ? 'loading…' : 'load more'}
          </button>
        </div>
      )}
    </div>
  )
}
