# Writing UI Kit

Long-form essay / case-study reader surface for Ajith's writing.

## Screens
- **Essay** (default and only screen) — full reading experience with topbar progress, byline actions, drop cap, pull quote, figure, and related posts.

## Interactions
- Scroll progress bar in the topbar
- `save` button toggles state
- `♡ like` / `✦ liked` button toggles state
- Related post cards hover with a hard-shadow offset

## Files
- `index.html` — entry
- `Essay.jsx` — single-component kit (it's a long-form page, not a grid of cards)
- `writing.css` — styles, imports root `colors_and_type.css`

## Type treatment
This kit leans hard on **Silkigfined** for accent words (serif-italic role), drop cap,
pull quote, and stat-like moments. **Chuner** is deliberately absent here — the reading
experience wants restraint, not chunky display type. Body is **Mulish** at 19px / 1.62.
