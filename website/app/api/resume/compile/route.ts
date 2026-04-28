import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const { latex } = await req.json()
    if (!latex || typeof latex !== 'string') {
      return NextResponse.json({ error: 'Missing latex source' }, { status: 400 })
    }
    if (!latex.trimStart().startsWith('\\documentclass')) {
      return NextResponse.json({ error: 'Not a valid LaTeX document' }, { status: 400 })
    }

    const compileUrl =
      'https://latexonline.cc/compile?text=' + encodeURIComponent(latex)

    const upstream = await fetch(compileUrl)

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `LaTeX compilation failed (upstream ${upstream.status})` },
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
