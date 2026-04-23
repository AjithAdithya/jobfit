# Portfolio UI Kit

A hi-fi, click-through recreation of Ajith's personal portfolio site.

## Screens
- **Work** (default) — Hero + featured project card + numbered project list
- **Writing** — field notes grid with editorial "hard-shadow" cards
- **About** — bio + oversized italic stat numbers

## Interactions
- Nav switches pages client-side (softly animated with a fade-up)
- Theme toggle flips between light (cream) and dark (violet-ink)
- Any project row / note card opens a toast ("opened · №…")
- Hero "Start a project" and footer email both open the contact modal, which fakes a send and confirms with a toast
- Hover states on project rows (inset padding + color shift), note cards (hard-shadow pop), buttons (lift + deepen)

## Files
- `index.html` — entry, wires components together
- `Nav.jsx`, `Hero.jsx`, `ProjectList.jsx`, `Notes.jsx`, `Panels.jsx` — components
- `portfolio.css` — component styles (imports the root `colors_and_type.css`)

## Tokens in use
All tokens pulled from `/colors_and_type.css`. No new colors, fonts, or spacing introduced — if you need to change the look, change the tokens at the root.

## Not yet / gaps
- Project detail pages are not built — rows toast open rather than navigating. Treat this kit as the "landing surfaces"; a case-study page would be its own kit.
- No RSS/feed UI, no newsletter form; assumed not needed for a personal brand yet.
