import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { latex } = await req.json()
    if (!latex || typeof latex !== 'string') {
      return NextResponse.json({ error: 'Missing latex source' }, { status: 400 })
    }
    if (!latex.trimStart().startsWith('\\documentclass')) {
      return NextResponse.json({ error: 'Not a valid LaTeX document' }, { status: 400 })
    }

    // texlive.net — public API run by the TeX Users Group
    // Requires multipart/form-data; filename must be document.tex
    const body = new FormData()
    body.append('filecontents[]', latex)
    body.append('filename[]', 'document.tex')
    body.append('engine', 'pdflatex')
    body.append('return', 'pdf')

    const upstream = await fetch('https://texlive.net/cgi-bin/latexcgi', {
      method: 'POST',
      body,
    })

    const ct = upstream.headers.get('content-type') ?? ''

    if (!upstream.ok || !ct.includes('application/pdf')) {
      const log = await upstream.text().catch(() => '')
      // Strip any HTML wrapping and surface the first LaTeX error line
      const stripped = log.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ')
      const errorLine = stripped.split(' ').join(' ').split(/(?=!)/).find(s => s.startsWith('!'))?.trim()
        ?? stripped.slice(0, 300).trim()
        ?? `service error ${upstream.status}`
      return NextResponse.json(
        { error: `LaTeX compilation failed: ${errorLine}` },
        { status: 502 }
      )
    }

    return new NextResponse(upstream.body, {
      headers: {
        'Content-Type': 'application/pdf',
        'Cache-Control': 'no-store',
      },
    })
  } catch (err: any) {
    console.error('[compile]', err)
    return NextResponse.json(
      { error: err.message || 'Compilation error' },
      { status: 500 }
    )
  }
}
