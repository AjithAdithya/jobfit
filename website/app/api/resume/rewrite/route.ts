import { NextRequest, NextResponse } from 'next/server'

interface RewriteBody {
  latex: string
  instruction: string
  context: {
    jobTitle: string
    keywords: string[]
    gaps: string[]
  }
}

const SYSTEM_PROMPT = `You are an expert LaTeX resume editor. The user has a tailored resume written in LaTeX and wants a specific modification applied.

Apply the user's instruction to the LaTeX source. Rules:
- Return ONLY the complete modified LaTeX document starting with \\documentclass.
- Preserve the document structure and preamble.
- Stay truthful — do not fabricate credentials or metrics not already present.
- Keep ATS best practices: single-column, standard headings, action verbs, metrics.
- No markdown fences, no explanation, just raw LaTeX.

LATEX SAFETY — always escape these characters or the document will fail to compile:
- Dollar amounts: \\$ not $ (e.g. \\$100K)
- Percent: \\% not % (e.g. 35\\%)
- Ampersand: \\& not &
- Hash: \\# not #
- Underscore in text: \\_ not _
- Never use bare $ — it opens math mode and breaks \\item on subsequent lines.`

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured.' }, { status: 500 })
    }

    const body = (await req.json()) as RewriteBody
    const { latex, instruction, context } = body

    if (!latex || !instruction) {
      return NextResponse.json({ error: 'latex and instruction are required' }, { status: 400 })
    }

    const userPrompt = `JOB TITLE: ${context.jobTitle}
TARGET KEYWORDS: ${context.keywords.join(', ') || 'none'}
GAPS BEING ADDRESSED: ${context.gaps.join(', ') || 'none'}

CURRENT LATEX RESUME:
${latex}

MODIFICATION INSTRUCTION:
${instruction}

Apply the instruction and return the complete modified LaTeX document.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 3000,
        temperature: 0.3,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message || `Claude error ${response.status}` },
        { status: 500 }
      )
    }

    const raw: string = data.content?.[0]?.text ?? ''
    const modified = raw
      .replace(/```latex\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim()

    if (!modified.includes('\\documentclass')) {
      return NextResponse.json({ error: 'Model did not return valid LaTeX. Try again.' }, { status: 502 })
    }

    return NextResponse.json({ latex: modified })
  } catch (err: any) {
    console.error('Resume rewrite error:', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
