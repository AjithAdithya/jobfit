import { NextRequest, NextResponse } from 'next/server'
import type { ResumeStyle } from '@/lib/types'

const TEMPLATE_DESC: Record<string, string> = {
  classic: 'traditional academic style with horizontal rules under section headers, serif-friendly',
  modern: 'clean contemporary style with colored section headers and minimal decorations',
  compact: 'dense information-first layout with reduced margins and tighter spacing',
}

const SYSTEM_PROMPT = `You are a LaTeX resume stylist. Re-style an existing LaTeX resume according to specifications. You must preserve ALL content exactly — every word, date, metric, and bullet point — while changing only the visual presentation.

You may change:
- Font packages in the preamble (\\usepackage for fonts, fontenc, inputenc)
- Page margins via geometry package
- Color definitions and their usage on headings/rules
- \\linespread, \\setlength for spacing
- Section header formatting (font size, weight, rule decorators, colors)
- Column layout (\\onecolumn vs \\twocolumn)
- Document class base font size option

You must NOT change:
- Any text content (names, job titles, descriptions, dates, metrics, bullets)
- The logical document structure or ordering of sections

Return ONLY the raw LaTeX starting with \\documentclass. No markdown, no explanation.`

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured.' }, { status: 500 })

    const { latex, style } = (await req.json()) as { latex: string; style: ResumeStyle }
    if (!latex || !style) return NextResponse.json({ error: 'latex and style are required' }, { status: 400 })

    const userPrompt = `Re-style this resume with the following specifications:

FONT — Heading: ${style.fontFamily.heading} | Body: ${style.fontFamily.body}
COLORS — Primary/accent: ${style.colors.primary} (apply to section headers, rules, decorative elements)
         Text: ${style.colors.text} | Muted: ${style.colors.muted}
SIZES — Name: ${style.fontSize.name}pt | Sections: ${style.fontSize.heading}pt | Body: ${style.fontSize.body}pt
SPACING — Between sections: ${style.spacing.section}pt | Item gap: ${style.spacing.item}pt | Line height: ${style.spacing.lineHeight}
LAYOUT — Columns: ${style.columns} | Show contact icons: ${style.showIcons}
TEMPLATE — ${style.template}: ${TEMPLATE_DESC[style.template] ?? style.template}

CURRENT LaTeX:
${latex}

Return the complete restyled LaTeX document.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 4000,
        temperature: 0.2,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      return NextResponse.json({ error: data.error?.message || `Claude error ${response.status}` }, { status: 500 })
    }

    const raw: string = data.content?.[0]?.text ?? ''
    const modified = raw.replace(/```latex\s*/gi, '').replace(/```\s*/g, '').trim()

    if (!modified.includes('\\documentclass')) {
      return NextResponse.json({ error: 'Model did not return valid LaTeX. Try again.' }, { status: 502 })
    }

    return NextResponse.json({ latex: modified })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
