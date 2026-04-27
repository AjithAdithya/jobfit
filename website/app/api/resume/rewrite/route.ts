import { NextRequest, NextResponse } from 'next/server'

interface RewriteBody {
  selection: string
  comment: string
  context: {
    fullResume: string
    jobTitle: string
    keywords: string[]
    gaps: string[]
  }
}

const SYSTEM_PROMPT = `You are an expert resume editor. The user has selected a specific snippet of HTML from their tailored resume and given an instruction for how to rewrite it.

Generate exactly THREE distinct variants for that snippet. Each variant must:
- Preserve the same HTML tag structure (if input is <li>...</li>, return <li>...</li>; if it's a fragment of text inside a <p>, return text only).
- Keep the rewrite ATS-friendly (no emojis, no decorative characters, no inline styles).
- Reflect the user's instruction faithfully while staying truthful to their existing experience context.
- Be distinct from each other in tone, structure, or emphasis — not three copies of the same sentence.

Output ONLY a single valid JSON object — no markdown, no commentary:
{"variants": ["...", "...", "..."]}`

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured on server.' },
        { status: 500 }
      )
    }

    const body = (await req.json()) as RewriteBody
    const { selection, comment, context } = body

    if (!selection || !comment) {
      return NextResponse.json({ error: 'selection and comment are required' }, { status: 400 })
    }

    const userPrompt = `JOB TITLE: ${context.jobTitle}

TARGET KEYWORDS: ${context.keywords.join(', ') || 'none'}
GAPS BEING ADDRESSED: ${context.gaps.join(', ') || 'none'}

FULL RESUME (for context only — do not rewrite the whole thing):
${context.fullResume}

SELECTED SNIPPET TO REWRITE:
${selection}

USER INSTRUCTION:
${comment}

Generate three distinct variant rewrites for the selected snippet. Output the JSON object only.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 1500,
        temperature: 0.7,
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

    const raw = data.content?.[0]?.text || ''
    const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim()
    const match = cleaned.match(/\{[\s\S]*\}/)
    const parsed = match ? JSON.parse(match[0]) : { variants: [] }
    const variants = Array.isArray(parsed.variants) ? parsed.variants.slice(0, 3) : []

    if (variants.length < 3) {
      return NextResponse.json(
        { error: 'Model returned fewer than 3 variants. Try again.' },
        { status: 502 }
      )
    }

    return NextResponse.json({ variants })
  } catch (err: any) {
    console.error('Resume rewrite error:', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
