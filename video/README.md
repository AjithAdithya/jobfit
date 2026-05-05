# JobFit — Remotion Video

Two compositions live in this package:

| ID | Size | Duration | Purpose |
|----|------|----------|---------|
| `WalkthroughVideo` | 1280×720 | ~40s | v1 sidebar walkthrough |
| `JobFitCinematic` | 1080×1080 | 60s | v2 cinematic LinkedIn video |

---

## Setup

```bash
cd video
npm install
```

---

## Preview in browser (Remotion Studio)

```bash
npm run preview
```

> **Windows ARM64 note:** Remotion's Rust compositor doesn't ship for arm64.  
> Use the GitHub Actions workflow to render on Linux x86 — see `.github/workflows/render-video.yml`.

---

## Render locally (Linux / macOS / WSL)

```bash
# v2 cinematic (recommended)
npm run render

# v1 sidebar walkthrough
npx remotion render src/index.ts WalkthroughVideo out/walkthrough.mp4

# WebM (smaller file, good for web embeds)
npm run render:webm
```

---

## GitHub Actions render (Windows ARM64 workaround)

Push to any branch → Actions tab → run **Render Video** workflow.  
The rendered `.mp4` is uploaded as a workflow artifact.

---

## Swapping screenshots

All screenshots live in `public/screenshots/`. Drop replacements with the same filename and re-render — no code changes needed.

| File | Scene | Description |
|------|-------|-------------|
| `ext-01-home.png` | S3 Problem, S4 Solution | Job page in browser / extension home |
| `ext-03-match-score.png` | S5 Magic | Match score UI (analysis result) |
| `ext-04-match-resume.png` | S6 Result (before) | Generic resume state |
| `ext-05-resume-preview.png` | S6 Result (after) | Tailored LaTeX resume |

---

## Brand tokens

All colors, typography, and spring configs are in `src/theme.ts`:

```ts
bg:      "#0A0B0E"   // near-black background
ink:     "#EDE9E3"   // warm cream text
accent:  "#C01414"   // crimson brand red
accent2: "#5DD4FF"   // sky blue highlights
citrus:  "#D7FF3A"   // citrus yellow-green accents
```

---

## Audio (optional)

Set `AUDIO_ENABLED = true` in `src/timings.ts`, then place files in `public/audio/`:

```
public/audio/
  ambient-loop.mp3   # background pad, ~60s loop
  click.mp3          # UI click SFX (frame S4_START+68)
  whoosh.mp3         # panel slide SFX (frame S4_START+78)
  ding.mp3           # scrubber reveal SFX (frame S6_START+22)
```

Free SFX sources: [Freesound.org](https://freesound.org), [Mixkit](https://mixkit.co/free-sound-effects/)

---

## Scene timing (src/timings.ts)

To re-time the whole video, edit only `timings.ts` — all scenes read from `T.*`.

```
S1   0–90    (3s)  — Hook: "generic" → "tailored."
S2   90–180  (3s)  — Logo reveal + tagline
S3   180–390 (7s)  — Problem: browser + callouts
S4   390–600 (7s)  — Solution: cursor + panel
S5   600–960 (12s) — Magic: streaming AI text
S6   960–1320(12s) — Result: before/after scrubber
S7   1320–1560(8s) — Credibility: arch diagram
S8   1560–1800(8s) — CTA: headline + URL
```
