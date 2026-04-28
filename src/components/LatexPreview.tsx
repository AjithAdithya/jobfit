import { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'

const LATEXJS_CDN = 'https://cdn.jsdelivr.net/npm/latex.js@0.12.6/dist/'

function isLatex(s: string) {
  return s.trimStart().startsWith('\\documentclass') || s.trimStart().startsWith('\\begin{')
}

interface Props {
  source: string
  className?: string
}

export default function LatexPreview({ source, className = '' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!containerRef.current || !source.trim()) return
    setStatus('loading')
    setErrorMsg('')

    if (!isLatex(source)) {
      containerRef.current.innerHTML = source
      setStatus('done')
      return
    }

    let cancelled = false

    ;(async () => {
      try {
        if (!document.querySelector('[data-latexjs-css]')) {
          for (const file of ['css/base.css', 'css/article.css']) {
            const link = document.createElement('link')
            link.rel = 'stylesheet'
            link.href = LATEXJS_CDN + file
            link.setAttribute('data-latexjs-css', file)
            document.head.appendChild(link)
          }
        }

        const { HtmlGenerator, parse } = await import('latex.js')
        if (cancelled) return

        const generator = new HtmlGenerator({ hyphenate: false })
        parse(source, { generator })
        const fragment = generator.domFragment()

        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = ''
          containerRef.current.appendChild(fragment)
          setStatus('done')
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setErrorMsg(e instanceof Error ? e.message : 'LaTeX render error')
          setStatus('error')
        }
      }
    })()

    return () => { cancelled = true }
  }, [source])

  return (
    <div className={`relative ${className}`} style={{ colorScheme: 'light' }}>
      {status === 'loading' && (
        <div className="flex items-center justify-center p-8 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          <span className="text-xs">rendering…</span>
        </div>
      )}
      {status === 'error' && (
        <div className="p-3 space-y-2">
          <p className="text-xs text-red-500 font-mono">render error: {errorMsg}</p>
          <pre className="text-[10px] text-gray-500 whitespace-pre-wrap font-mono leading-relaxed max-h-[250px] overflow-y-auto bg-gray-50 p-2 rounded">
            {source.slice(0, 600)}
          </pre>
        </div>
      )}
      <div
        ref={containerRef}
        style={{ display: status === 'done' ? 'block' : 'none' }}
      />
    </div>
  )
}
