import { NextRequest, NextResponse } from 'next/server'
import type { ResumeStyle } from '@/lib/types'

// Maps each font name to the exact pdflatex-compatible \usepackage commands.
// All of these ship in TeX Live 2020+ and work with pdflatex.
const FONT_PACKAGES: Record<string, string> = {
  'Latin Modern':      '\\usepackage[T1]{fontenc}\n\\usepackage{lmodern}',
  'TeX Gyre Termes':   '\\usepackage[T1]{fontenc}\n\\usepackage{tgtermes}',
  'TeX Gyre Heros':    '\\usepackage[T1]{fontenc}\n\\usepackage{tgheros}\n\\renewcommand{\\familydefault}{\\sfdefault}',
  'TeX Gyre Pagella':  '\\usepackage[T1]{fontenc}\n\\usepackage{tgpagella}',
  'TeX Gyre Bonum':    '\\usepackage[T1]{fontenc}\n\\usepackage{tgbonum}',
  'EB Garamond':       '\\usepackage[T1]{fontenc}\n\\usepackage{ebgaramond}',
  'Lato':              '\\usepackage[T1]{fontenc}\n\\usepackage[default]{lato}',
  'Source Sans Pro':   '\\usepackage[T1]{fontenc}\n\\usepackage[default]{sourcesanspro}',
}

const TEMPLATE_DESC: Record<string, string> = {
  classic: 'traditional, horizontal rules under section headers',
  modern:  'clean, colored section headers, minimal decorations',
  compact: 'dense, reduced margins, tighter spacing throughout',
}

function buildFontInstructions(style: ResumeStyle): string {
  const hPkg = FONT_PACKAGES[style.fontFamily.heading] ?? FONT_PACKAGES['Latin Modern']
  const bPkg = FONT_PACKAGES[style.fontFamily.body]    ?? FONT_PACKAGES['Latin Modern']
  // If heading and body resolve to the same package, only emit once
  const pkgs = hPkg === bPkg ? hPkg : `${hPkg}\n% body font:\n${bPkg}`
  return `Replace all font packages in the preamble with EXACTLY these lines (remove any existing font packages first):
${pkgs}
Do NOT use \\usepackage{fontspec}, xunicode, xltxtra, or any XeLaTeX/LuaLaTeX font package.`
}

const SYSTEM_PROMPT = `You are a pdflatex resume stylist. You re-style an existing LaTeX resume so it compiles with pdflatex.

STRICT RULES:
1. Preserve ALL content exactly — every word, date, metric, bullet, and ordering.
2. Never use fontspec, xunicode, xltxtra, luatextra, or any XeLaTeX/LuaLaTeX-only package.
3. Use only pdflatex-compatible packages (lmodern, tgtermes, tgheros, tgpagella, tgbonum, ebgaramond, lato, sourcesanspro, xcolor, geometry, etc.).
4. Keep \\usepackage[utf8]{inputenc} if present.
5. For colors use \\usepackage{xcolor} with \\definecolor{accent}{HTML}{RRGGBB} (no leading #).
6. Return ONLY raw LaTeX starting with \\documentclass — no markdown fences, no explanation.`

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured.' }, { status: 500 })

    const { latex, style } = (await req.json()) as { latex: string; style: ResumeStyle }
    if (!latex || !style) return NextResponse.json({ error: 'latex and style are required' }, { status: 400 })

    // Strip the # from hex colors for \definecolor{}{HTML}{...}
    const primaryHex = style.colors.primary.replace('#', '')
    const textHex    = style.colors.text.replace('#', '')
    const mutedHex   = style.colors.muted.replace('#', '')

    const userPrompt = `Apply this visual style to the LaTeX resume below.

FONT PACKAGES — ${buildFontInstructions(style)}

COLORS (use \\definecolor with HTML format, no leading #):
  \\definecolor{accent}{HTML}{${primaryHex}}   % section headers, rules
  \\definecolor{bodytext}{HTML}{${textHex}}
  \\definecolor{muted}{HTML}{${mutedHex}}

SIZES:
  Name/title: ${style.fontSize.name}pt
  Section headings: ${style.fontSize.heading}pt
  Body text: ${style.fontSize.body}pt (set as document base or \\small override)

SPACING:
  Between sections: ${style.spacing.section}pt (\\vspace or \\setlength\\sectionskip)
  Line spread: \\linespread{${style.spacing.lineHeight}}

LAYOUT:
  Columns: ${style.columns} (use \\twocolumn if 2, otherwise \\onecolumn / single-column article)
  Contact icons: ${style.showIcons ? 'keep or add FontAwesome icons' : 'remove icons, use plain text'}

TEMPLATE STYLE: ${style.template} — ${TEMPLATE_DESC[style.template] ?? style.template}

MARGINS (geometry package):
${style.template === 'compact'
  ? '  top=0.5in, bottom=0.5in, left=0.5in, right=0.5in'
  : '  top=0.75in, bottom=0.75in, left=0.75in, right=0.75in'}

RESUME TO RESTYLE:
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
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        temperature: 0.1,
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
