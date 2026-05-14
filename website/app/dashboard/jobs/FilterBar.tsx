'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'

const SCORE_BANDS = [
  { label: 'Any', value: '0' },
  { label: 'Stretch 50+', value: '50' },
  { label: 'Strong 65+', value: '65' },
  { label: 'Great 75+', value: '75' },
  { label: 'Elite 85+', value: '85' },
]

const LOCATION_TYPES = [
  { label: 'Any', value: '' },
  { label: 'Remote', value: 'remote' },
  { label: 'Hybrid', value: 'hybrid' },
  { label: 'On-site', value: 'onsite' },
]

const ROLE_FAMILIES = [
  '', 'fullstack', 'backend', 'frontend', 'ml-ai', 'data',
  'platform', 'mobile', 'security', 'qa', 'product', 'design', 'em', 'other',
]

export default function FilterBar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const update = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete('offset') // reset pagination on filter change
    router.push(`${pathname}?${params.toString()}`)
  }, [router, pathname, searchParams])

  const current = (key: string, fallback = '') => searchParams.get(key) ?? fallback

  return (
    <div className="sticky top-0 z-20 bg-cream border-b border-ink-200 py-3 px-4 sm:px-6 lg:px-10">
      <div className="max-w-[1280px] mx-auto flex flex-wrap gap-3 items-center">

        {/* Score band */}
        <div className="flex items-center gap-1">
          <span className="font-mono text-[9px] text-ink-400 tracking-caps uppercase mr-1">score</span>
          {SCORE_BANDS.map(band => (
            <button
              key={band.value}
              onClick={() => update('score', band.value === '0' ? '' : band.value)}
              className={`px-2.5 py-1.5 font-mono text-[10px] tracking-caps uppercase border transition-colors ${
                current('score', '0') === band.value || (band.value === '0' && !current('score'))
                  ? 'border-ink-900 bg-ink-900 text-cream'
                  : 'border-ink-200 text-ink-500 hover:border-ink-900 hover:text-ink-900'
              }`}
            >
              {band.label}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-ink-200 hidden sm:block" />

        {/* Location */}
        <div className="flex items-center gap-1">
          <span className="font-mono text-[9px] text-ink-400 tracking-caps uppercase mr-1">location</span>
          {LOCATION_TYPES.map(lt => (
            <button
              key={lt.value}
              onClick={() => update('loc', lt.value)}
              className={`px-2.5 py-1.5 font-mono text-[10px] tracking-caps uppercase border transition-colors ${
                current('loc') === lt.value
                  ? 'border-sky bg-sky/10 text-sky'
                  : 'border-ink-200 text-ink-500 hover:border-ink-900 hover:text-ink-900'
              }`}
            >
              {lt.label}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-ink-200 hidden sm:block" />

        {/* Role family */}
        <div className="flex items-center gap-1">
          <span className="font-mono text-[9px] text-ink-400 tracking-caps uppercase mr-1">role</span>
          <select
            value={current('role')}
            onChange={e => update('role', e.target.value)}
            className="border border-ink-200 bg-white px-2 py-1.5 font-mono text-[10px] text-ink-900 focus:outline-none focus:border-ink-900"
          >
            {ROLE_FAMILIES.map(r => (
              <option key={r} value={r}>{r || 'any'}</option>
            ))}
          </select>
        </div>

        {/* Saved toggle */}
        <button
          onClick={() => update('saved', current('saved') === 'true' ? '' : 'true')}
          className={`ml-auto px-3 py-1.5 font-mono text-[10px] tracking-caps uppercase border transition-colors ${
            current('saved') === 'true'
              ? 'border-ink-900 bg-ink-900 text-cream'
              : 'border-ink-200 text-ink-500 hover:border-ink-900'
          }`}
        >
          saved only
        </button>
      </div>
    </div>
  )
}
