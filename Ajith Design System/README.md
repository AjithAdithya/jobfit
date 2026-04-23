# Ajith — Personal Brand Design System

> A bold, editorial, slightly arty system for Ajith's personal brand. Geometric sans meets quirky editorial serif, anchored by an ultraviolet hero, punctuated by acid citrus and flare-red accents.

---

## The brand in one paragraph

Ajith is technically sharp, playful, and experimental. The brand reflects that: precise geometric structure (the monogram mark is built from circles and diagonals, all at a single thin line weight), paired with an editorial serif (loose italic, quirky swashes) that gives it personality and swagger. Ultraviolet is the hero — pulled directly from the existing logo gradient — and it sits against cream paper and inky near-black, with sharp accent pops (acid citrus lime, flare tangerine-red) used sparingly.

Think: MIT Media Lab meets Italian editorial design, built on the web.

---

## What you were given

| Source | Path | Notes |
|---|---|---|
| Logo file | `uploads/logo_file-1776783060616.png` (→ `assets/logo-full.png`) | Monoline "AJ" monogram in a circle, set against a violet/indigo gradient banner with a small sparkle. |

No codebase, Figma, or additional copy was provided, so the content fundamentals and visual foundations below are **derived from the logo + the explicit brand adjectives**: *technical & sharp, playful & energetic, experimental & arty*. Treat them as the starting point, not gospel — iterate with Ajith.

---

## Index — what's in this project

```
├── README.md                    ← you are here
├── SKILL.md                     ← agent-skill manifest (for Claude Code)
├── colors_and_type.css          ← all design tokens (CSS vars)
├── assets/                      ← logos, marks, banners
│   ├── logo-full.png            ← the original delivered banner
│   ├── logo-banner.png          ← duplicate for use as a section banner
│   ├── logo-mark-white.png      ← mark only, white on transparent
│   └── logo-mark-black.png      ← mark only, ink on transparent
├── preview/                     ← Design System tab cards (dev-facing)
│   ├── *.html                   ← one card per sub-concept
├── ui_kits/
│   ├── portfolio/               ← personal site UI kit
│   ├── writing/                 ← long-form essay / case study kit
│   └── brand/                   ← business card, social banner, stationery
```

---

## Content fundamentals

**Voice:** first-person singular but restrained — *"I build"*, *"I'm interested in"*, never *"we"*. Confident, curious, a little dry. Avoid hype language (*revolutionary, game-changing, 10x*).

**Tone by surface:**
| Surface | Tone | Example |
|---|---|---|
| Hero / bio | Declarative, quietly confident | *"I design tools for people who think in systems."* |
| Project intros | Descriptive, specific, technical | *"A 2024 experiment in programmable typography. Runs on an ESP32."* |
| Writing / essays | Exploratory, first-person, long sentences OK | *"I kept wondering whether the interesting thing about this wasn't the output at all, but the constraints..."* |
| UI microcopy | Terse, lowercase where appropriate | *"back to top"*, *"new note"* |
| Errors / empty states | Warm, slightly self-aware | *"nothing here yet — that's a feature."* |

**Casing:**
- **Display headlines:** Title Case *or* all-lowercase for editorial tension (choose per page, commit).
- **UI labels, nav, buttons:** lowercase for the arty/playful register, sentence case for straight-forward UI. Never ALL CAPS except for eyebrows and metadata tags.
- **Eyebrows / metadata / code tags:** UPPERCASE with wide tracking, monospace.

**Emoji:** never in product UI. Rarely (and only ironically) in writing. Never as icons.

**Unicode accents** that *are* welcome: `—` (em dash), `·` (middle dot) as separator, `→` / `↗` for directional cues, `№`, `*` (as a typographic ornament), `¶`.

**Length discipline:** Bios ≤ 2 sentences. Project descriptions ≤ 40 words. Essay titles editorial-length, sometimes a full phrase.

**Example copy chunks:**
> **Hero:** *Ajith* — designer, engineer, occasional typographer. Building quiet tools in loud colors.

> **Project card:** `№ 07 — GLYPH STUDIO` · A browser-based variable font playground. WebGL, 2024.

> **Footer:** you've reached the bottom. take care out there. · built from scratch in 2026.

---

## Visual foundations

### Color
Three layers:
1. **Brand core:** `--brand-violet-*` scale, pulled from the logo gradient. `--brand-violet-500` (`#5B2FE6`) is the hero.
2. **Bold accents (used sparingly, one at a time):** `--accent-citrus` (acid lime `#D7FF3A`), `--accent-flare` (crimson `#FF4D2E`), `--accent-cream` (warm paper `#F3EBDA`), `--accent-sky` (electric cyan `#5DD4FF`).
3. **Neutrals:** warm off-white `--neutral-50` (`#FAF8F4`) through violet-tinted near-black `--neutral-900`. The neutrals are not pure grey — they have a faint cream undertone that keeps the whole palette warm.

**Never**: pure black on pure white, or bluish-purple tech-startup gradients. Keep ultraviolet honest.

### Type
- **Sans (body/UI):** `Mulish` (Google Fonts) substitutes for **Cera Pro** — same low-contrast geometric character. ⚠️ See *Font substitutions* below.
- **Editorial accent serif:** `Silkigfined` — Ajith's own face. Quirky, high-contrast; used as a single-word italic-role accent inside display lines, or for pull quotes and stat numbers.
- **Chunky display:** `Chuner` — Ajith's own face. Bold, high personality; this is the hero headline voice.
- **Mono (code / eyebrows / metadata):** `JetBrains Mono`.

**The signature move** is mixing a bold Chuner (or geometric sans) headline with a Silkigfined accent word in the middle: *"I build **quiet** tools."* — where *quiet* is set in Silkigfined at 1.05× the size and in the brand violet. Use this; it's the strongest type gesture.

### Spacing
4pt base. Tokens: `--s-1` (4) through `--s-16` (128). Generous — prefer `--s-6` (32) between sections, `--s-9` (64) for hero/section breaks.

### Backgrounds
- **Default:** `--accent-cream` or `--neutral-50` (paper). NOT white.
- **Inverted hero / CTA:** `--bg-invert` (violet-tinted ink). The logo banner gradient (`--grad-ultraviolet`) is a legitimate hero choice but **used at most once per page**.
- **No textures, no patterns, no grain as default.** Keep surfaces clean so the type + color do the work. Grain allowed in hero imagery only (see imagery rules).

### Animation
- **Easing:** `--ease-out-expo` for entries; `--ease-spring` for UI pops (buttons pressing, toggles); `--ease-in-out` for transitions between views.
- **Durations:** 80ms instant feedback, 160ms fast (hovers), 260ms medium (modal / panel), 440ms slow (page transitions, hero reveals).
- **Style:** quick, crisp, slightly overshoot springs on tactile moments. No bouncy cartoons. No fades longer than 300ms. Text reveals use a line-by-line stagger, never letter-by-letter.

### Hover & press states
- **Hover:** prefer a **shift** (translate -1px / -2px) combined with the accent color ink becoming deeper, not a color fade. On cards, add `--shadow-lg`.
- **Press:** scale down to 0.97, 80ms. Buttons darken one step.
- **Text link hover:** swap to `--link-hover` AND animate the underline from 1px to 2px.

### Borders
Thin. 1px always. `--border` in light UI, `--border-ink` for editorial "printed" card outlines (used on project cards, quote cards). No heavy 2–3px borders except on the logo mark itself.

### Shadows
Two systems:
- **Soft print shadows** (`--shadow-sm` → `--shadow-xl`) — used for elevation. Tint is violet-ink, not grey, so shadows feel of the brand.
- **Glow** (`--shadow-glow`) — reserved for the primary button focus state and the hero monogram on dark backgrounds. Never decorative.

### Transparency & blur
- Backdrop-blur allowed on the sticky nav (8–12px) when content scrolls under it. `background: rgba(250, 248, 244, 0.72); backdrop-filter: blur(12px)`.
- **No frosted-glass cards**, no glass-everywhere aesthetic.

### Corner radii
- **UI chrome:** `--r-md` (10px) for inputs/buttons, `--r-lg` (14px) for cards.
- **Editorial cards & images:** `--r-xl` (20px) or squared (radius 0) — pick per composition. The contrast between very round and very square is part of the look.
- **Pills:** `--r-pill` for tags, chips, status badges.

### Layout rules
- **Max content width:** 1280px. Long-form reading: 68ch.
- **Asymmetry is allowed and encouraged** — offset hero titles to the left 1–2 columns; let images hang into the gutter.
- **Sticky nav** at top, optionally minimal (monogram + 3 links + theme toggle). Never a full mega-menu.
- **Footer:** generous (8+ units of spacing above), single row, mono-tagged.

### Imagery
- **Portraits:** warm, slightly desaturated, grainy. Not overly polished.
- **Project imagery:** high-contrast screenshots, full-bleed where possible, with a 1px ink outline if placed in a card.
- **Generic "mood" images:** avoid unless specifically a case-study illustration. Type + color carries the brand.
- **Avoid:** stock photos, 3D gradient blobs, AI-generated slop.

---

## Iconography

**Approach:** **monoline, 1.5–1.75px stroke, rounded joins, 24px grid.** The logo mark itself is a monoline geometric construction — icons must match.

- **Primary icon set:** **Lucide** (via CDN). It matches the monoline aesthetic perfectly, is free, and is well-maintained. Load from `https://unpkg.com/lucide@latest/dist/umd/lucide.js`.
- **Fallback:** Heroicons outline style (24px stroke 1.5).
- **Custom marks** (the monogram, a sparkle, a few ornaments) live in `assets/` as transparent PNGs.
- **No emoji as icons.** Ever.
- **No mixed icon systems.** Pick Lucide, stay in Lucide.
- **Stroke color:** inherits from text (`stroke="currentColor"`). Let the context color it, never hardcode.
- **Sizing:** inline icons = `1em` (match cap height); standalone = 20px or 24px.

Document any icon substitution in the README of that UI kit.

---

## ⚠️ Font substitutions flagged

| Role | Using | Status |
|---|---|---|
| **Body / UI (Cera Pro alike)** | `Mulish` (Google Fonts) | ⚠️ substitute — if Ajith has licensed Cera Pro `.woff2` files, drop them in `fonts/` and we'll swap. |
| **Editorial serif** | `Silkigfined` (Ajith's own) | ✅ real brand face, `fonts/Silkigfined-Regular-BF69e721a0a3ad2.otf` |
| **Chunky display** | `Chuner Demo` (Ajith's own) | ✅ real brand face, `fonts/ChunerDemo-BF69e73d11e80b2.otf` |
| **Mono** | `JetBrains Mono` (Google Fonts) | ✅ fine as-is unless you have a preferred mono |

**How the three faces divide labor:**
- **Chuner** (`--font-chunk`) — the headline voice. Chunky, high-personality display. Used for hero, section titles, footer statements. One size up from whatever the sans would be.
- **Silkigfined** (`--font-edit`) — the accent voice. Quirky high-contrast editorial serif. Used for *single-word italic-role accents* inside Chuner or sans headlines, pull quotes, stat numbers, and brand wordmark. **Never** set body copy in it.
- **Mulish** (`--font-sans`) — the utility voice. Body text, UI labels, navigation, forms.

**Ask for Ajith:** if you own Cera Pro licenses, drop the `.woff2` in `fonts/` and we'll swap Mulish out in five minutes.

---

## Motifs checklist

- Circle + diagonal grid (from the monogram)
- Monoline geometry at a single thin weight
- A sparkle (✦ or a custom SVG 4-pointed star) used as punctuation
- Number prefixes like `№ 01` for ordered lists (project index, table of contents)
- Mono eyebrows with wide tracking over display headlines
- Occasional serif italic word sitting inside a sans sentence
- Ultraviolet + cream, with exactly one accent color per page

That's it. Keep it restrained, keep it confident.
