'use client'
import { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'

type Status = 'idle' | 'loading-engine' | 'compiling' | 'done' | 'error'

function isLatex(s: string) {
  return s.trimStart().startsWith('\\documentclass')
}

interface Props {
  source: string
  className?: string
}

export default function LatexPreview({ source, className = '' }: Props) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const prevUrl = useRef<string | null>(null)

  useEffect(() => {
    if (!source.trim() || !isLatex(source)) return
    let cancelled = false

    async function run() {
      setStatus('loading-engine')
      setError(null)

      if (!(window as any).PdfTeXEngine) {
        await new Promise<void>((resolve, reject) => {
          const existing = document.querySelector('script[data-swiftlatex]')
          if (existing) { resolve(); return }
          const s = document.createElement('script')
          s.src = 'https://swiftlatex.github.io/SwiftLaTeX/dist/pdftexengine.js'
          s.setAttribute('data-swiftlatex', '1')
          s.onload = () => resolve()
          s.onerror = () => reject(new Error('Failed to load SwiftLaTeX engine'))
          document.head.appendChild(s)
        })
      }

      if (cancelled) return

      const Engine = (window as any).PdfTeXEngine
      const engine = new Engine()
      await engine.loadEngine()

      if (cancelled) return

      setStatus('compiling')
      engine.writeMemFSFile('main.tex', source)
      engine.setEngineMainFile('main.tex')
      const result = await engine.compileLaTeX()

      if (cancelled) return

      if (result.status !== 0) {
        throw new Error(result.log?.slice(-3000) || 'Compile error')
      }

      const blob = new Blob([result.pdf], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      if (prevUrl.current) URL.revokeObjectURL(prevUrl.current)
      prevUrl.current = url
      setPdfUrl(url)
      setStatus('done')
    }

    run().catch(e => {
      if (!cancelled) {
        setError(String(e))
        setStatus('error')
      }
    })

    return () => { cancelled = true }
  }, [source])

  if (!source.trim()) return null

  if (!isLatex(source)) {
    return <div className={className} dangerouslySetInnerHTML={{ __html: source }} />
  }

  return (
    <div className={`relative ${className}`}>
      {(status === 'loading-engine' || status === 'compiling') && (
        <div className="flex items-center justify-center p-10 text-ink-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-[13px]">
            {status === 'loading-engine' ? 'loading engine…' : 'compiling…'}
          </span>
        </div>
      )}
      {status === 'error' && (
        <pre className="p-4 text-[11px] text-red-600 bg-red-50 whitespace-pre-wrap overflow-auto max-h-[300px]">
          {error}
        </pre>
      )}
      {pdfUrl && (
        <iframe
          src={pdfUrl}
          style={{
            border: 'none',
            width: '100%',
            height: '1100px',
            display: status === 'done' ? 'block' : 'none',
            background: 'white',
          }}
          title="Resume Preview"
        />
      )}
    </div>
  )
}
