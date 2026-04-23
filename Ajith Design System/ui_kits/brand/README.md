# Brand UI Kit

Stationery, social, and merch surfaces for Ajith's personal brand. Pure static HTML
(no JSX) since these are mostly print-style compositions.

## Pieces
- **Business card** (front gradient + back cream, 360×216 at ~2x print size)
- **Social banner** (3:1, sized for generic profile headers)
- **Avatar** (3 treatments — gradient, ink, paper)
- **Email signature** (inline HTML-friendly)
- **Stickers & pins** (4 compositions — round, square, ink, flare)

## Files
- `index.html` — everything on one page
- `brand.css` — styles, imports root `colors_and_type.css`

## Notes
- Sizes are display-approximations, not final print specs. For real print output, re-export
  at the target DPI and convert the CSS gradients to raster.
- The business card back uses the signature type move at max volume — Chuner with a
  Silkigfined accent. Great use case for this kit.
