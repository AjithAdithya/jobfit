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

    // Use multipart POST — putting full LaTeX in a query string hits URL length limits
    const form = new FormData()
    form.append('file', new Blob([latex], { type: 'application/x-tex' }), 'resume.tex')

    const upstream = await fetch('https://latexonline.cc/compile', {
      method: 'POST',
      body: form,
    })

    if (!upstream.ok) {
      const log = await upstream.text().catch(() => '')
      // Surface the first meaningful log line so the user can act on it
      const brief = log
        .split('\n')
        .find(l => l.startsWith('!') || l.includes('Error'))
        ?.trim()
        ?? `upstream ${upstream.status}`
      return NextResponse.json(
        { error: `LaTeX compilation failed: ${brief}` },
        { status: 502 }
      )
    }

    const pdf = await upstream.arrayBuffer()
    return new NextResponse(pdf, {
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
