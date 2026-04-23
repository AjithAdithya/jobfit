# SKILL.md — Ajith's personal brand system

This file tells Claude how to reuse this design system in future projects.
Read it first. Then read `README.md` for the human-facing overview.

## What this is
A personal brand & design system for **Ajith** — a designer/engineer/typographer.
Voice is *quiet tools in loud colors*: crisp geometric sans set alongside a quirky editorial
serif, a chunky display face, a bold crimson hero color against cool dark greys and blacks,
and a small cast of accents (acid lime, crimson-tangerine flare, warm cream, electric cyan).

## The one rule
Every design touching this brand must `@import url('colors_and_type.css')` (or copy it in)
and pull colors/type via the CSS variables defined there. Do NOT hardcode hex values or
reintroduce the old violet palette — the system is now crimson-led.

## Type system (three real brand faces)

| Token | Family | Role |
|---|---|---|
| `--font-sans` | **Cera Pro** (licensed, files in `fonts/`), Mulish fallback | All body, UI, nav, forms |
| `--font-chunk` | **Chuner** (Ajith's own) | Big display headlines — hero, footer statement, stickers |
| `--font-edit` | **Silkigfined** (Ajith's own) | Editorial accent words inside headlines, pull quotes, stat numbers, wordmark |
| `--font-mono` | JetBrains Mono | Eyebrows, metadata, code, tags |

**Signature move** (use this a lot — it is the brand):
```html
<h1>I build <em>quiet</em> tools in loud colors.</h1>
```
```css
h1    { font-family: var(--font-chunk); font-weight: 400; letter-spacing: -0.02em; }
h1 em { font-family: var(--font-edit); font-style: normal; color: var(--brand-red-500);
        font-size: 1.05em; }
```
A **chunky display headline** with a **single Silkigfined accent word** in the brand crimson.
`em` is semantic — use it for the accent, don't rely on a class.

**Scale:** hero 68-128px, section title 38px, subsection 28px, body 17-19px, small 14px, mono 11px.
Body line-height 1.6-1.65, display line-height 0.95-1.02.

## Color system

### Hero scale — Crimson
```
--brand-red-500 #C01414   ← primary (use for accents, active states, serif accent word)
--brand-red-700 #7A0707   ← deep red for pressed/hover
--brand-red-ink #1A0000   ← gradient terminus
```
Full scale `50 → ink` in `colors_and_type.css`.
Legacy aliases `--brand-violet-*` still resolve to the crimson scale for any code
written before the pivot — **prefer the new `--brand-red-*` names in new work**.

### Neutrals — cool dark greys
```
--neutral-50  #F5F6F7   ← default page bg (cool near-white, NOT cream)
--neutral-200 #D3D6DB   ← borders
--neutral-500 #555A63   ← muted text
--neutral-900 #0A0B0E   ← near-black, primary text
```
Do NOT use warm paper neutrals (the old `#FAF8F4`-family) — the system has been pulled
toward cool/neutral greys and near-black to sit harder against the crimson.

### Accents — use sparingly
```
--accent-citrus #D7FF3A   acid lime    ← one pop per screen on dark bg
--accent-flare  #FF4D2E   tangerine    ← danger/warn/rare emphasis
--accent-cream  #EDE9E3   warm paper   ← soft card bg when you need warmth
--accent-sky    #5DD4FF   electric cyan ← informational only
```

### Signature gradient
`--grad-ultraviolet` (keeps its name for back-compat) is now a `crimson → ink` diagonal.
Use it on the logo mark background, business card front, social banner, hero treatments.
`--grad-aurora` (crimson → flare → citrus) is for rare, expressive moments only.

## Iconography
- **No emoji, no stroke-icon libraries.** When a glyph is needed, use a Unicode character
  (✦, →, ←, ·, ◦, №) or draw a minimal SVG. Keep one color maximum.
- Prefer **typographic eyebrows** over icons. `<span class="eyebrow">№ 01 · PROJECT</span>`
  does more than any icon does.

## Spacing & radii
4px grid. Tokens `--s-0` through `--s-32` in `colors_and_type.css`.
Radii `--r-xs 4px → --r-2xl 28px`. Pills are `--r-full`.
Shadows `--shadow-sm / md / lg / xl` — subtle, cool, no coloration.

## UI kits (ready to use)
- `ui_kits/portfolio/` — public landing. Hero, project list (expanding rows on hover),
  feature panels, notes, nav.
- `ui_kits/writing/` — long-form essay reader. Topbar scroll progress, drop cap,
  pull quote, related posts. Uses only Silkigfined + Mulish, **no Chuner** — restraint
  is the point of this surface.
- `ui_kits/brand/` — stationery: business card, social banner, avatar treatments,
  email signature, stickers. This is where the signature type move gets *loudest*.

## When extending
1. Start a new surface by linking `colors_and_type.css` at the project root.
2. Reach for existing tokens before inventing. If you need a new token, add it to
   `colors_and_type.css` with a comment and a justification.
3. Before adding a gradient, background image, or third color on a screen, stop and ask
   whether the design needs it or whether you're decorating. Ajith's whole thing is
   restraint — the crimson is loud enough; support it with quiet.
4. Never pair the crimson with warm paper neutrals. It was deliberately removed.
5. When in doubt about a headline, use the signature move. It will not let you down.

## Files index
- `colors_and_type.css` — all tokens, resets, utilities
- `README.md` — human overview, font-license notes
- `preview/*.html` — design-system cards (Type, Colors, Spacing, Components, Brand)
- `ui_kits/*/` — the three surfaces above
- `assets/logo-*.png` — logo lockups
- `fonts/` — Cera Pro OTFs, Silkigfined, Chuner
