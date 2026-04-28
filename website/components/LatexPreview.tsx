'use client'
import { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'

function isLatex(s: string) {
  const t = s.trimStart()
  return t.startsWith('\\documentclass') || t.startsWith('\\begin{')
}

interface Props {
  source: string
  className?: string
}

export default function LatexPreview({ source, className = '' }: Props) {
  const [srcdoc, setSrcdoc] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [iframeHeight, setIframeHeight] = useState(1100)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (!source.trim()) return
    setLoading(true)

    if (!isLatex(source)) {
      const html = `<!DOCTYPE html><html><body style="margin:0;padding:16px;font-family:sans-serif">${source}</body></html>`
      setSrcdoc(html)
      return
    }

    const escaped = JSON.stringify(source)
    const doc = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/latex.js@0.12.6/dist/css/base.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/latex.js@0.12.6/dist/css/article.css">
  <style>
    html, body { margin: 0; padding: 0; background: white; }
    .page { box-shadow: none !important; margin: 0 !important; }
  </style>
</head>
<body>
<script type="module">
  import { HtmlGenerator, parse } from 'https://cdn.jsdelivr.net/npm/latex.js@0.12.6/dist/latex.mjs'
  try {
    const source = ${escaped}
    const generator = new HtmlGenerator({ hyphenate: false })
    parse(source, { generator })
    const fragment = generator.domFragment()
    document.body.innerHTML = ''
    document.body.appendChild(fragment)
    window.parent.postMessage({ type: 'latex-ready', height: document.body.scrollHeight }, '*')
  } catch (e) {
    document.body.innerHTML = '<pre style="color:red;padding:16px;font-size:12px;white-space:pre-wrap">' + String(e) + '</pre>'
    window.parent.postMessage({ type: 'latex-error' }, '*')
  }
<\/script>
</body>
</html>`
    setSrcdoc(doc)
  }, [source])

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.data?.type === 'latex-ready') {
        setLoading(false)
        if (e.data.height > 100) setIframeHeight(e.data.height + 32)
      } else if (e.data?.type === 'latex-error') {
        setLoading(false)
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  if (!source.trim()) return null

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="flex items-center justify-center p-10 text-ink-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          <span className="text-[13px]">rendering…</span>
        </div>
      )}
      {srcdoc && (
        <iframe
          ref={iframeRef}
          srcDoc={srcdoc}
          style={{
            border: 'none',
            width: '100%',
            height: `${iframeHeight}px`,
            display: loading ? 'none' : 'block',
            background: 'white',
          }}
          onLoad={() => {
            if (!isLatex(source)) setLoading(false)
          }}
          sandbox="allow-scripts"
          title="LaTeX Preview"
        />
      )}
    </div>
  )
}
