import { useState } from 'react'

function isLatex(s: string) {
  return s.trimStart().startsWith('\\documentclass')
}

interface Props {
  source: string
  className?: string
}

export default function LatexPreview({ source, className = '' }: Props) {
  const [expanded, setExpanded] = useState(false)

  if (!source.trim()) return null

  if (!isLatex(source)) {
    return <div className={className} dangerouslySetInnerHTML={{ __html: source }} />
  }

  return (
    <div className={`relative ${className}`}>
      <pre
        className={`font-mono text-[10px] text-ink-700 bg-ink-50 p-3 overflow-auto whitespace-pre-wrap border border-ink-200 ${expanded ? '' : 'max-h-[300px]'}`}
      >
        {source}
      </pre>
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full text-[10px] font-mono text-ink-400 hover:text-ink-700 py-1 border-t border-ink-200 bg-ink-50 transition-colors"
      >
        {expanded ? '▲ collapse' : '▼ show full source'}
      </button>
    </div>
  )
}
