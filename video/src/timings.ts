// Single source of truth for every frame boundary.
// To re-time the whole video, edit ONLY this file.

export const FPS   = 30;
export const W     = 1080;
export const H     = 1080; // square for LinkedIn; Root.tsx reads this

// Audio toggle — flip to true after placing files in public/audio/
// See README.md for free download commands
export const AUDIO_ENABLED = false;

// ── Scene boundaries ──────────────────────────────────────────
export const T = {
  S1_START:  0,
  S1_DUR:    90,   // 3s  — Hook: "generic" → "tailored."

  S2_START:  90,
  S2_DUR:    90,   // 3s  — Logo reveal + tagline

  S3_START:  180,
  S3_DUR:    210,  // 7s  — Problem: browser + floating callouts

  S4_START:  390,
  S4_DUR:    210,  // 7s  — Solution: cursor clicks, panel slides in

  S5_START:  600,
  S5_DUR:    360,  // 12s — Magic: streaming AI text + status chips

  S6_START:  960,
  S6_DUR:    360,  // 12s — Result: before/after scrubber + diff highlights

  S7_START:  1320,
  S7_DUR:    240,  // 8s  — Credibility: architecture diagram

  S8_START:  1560,
  S8_DUR:    240,  // 8s  — CTA: gradient + headline + URL

  TOTAL:     1800, // 60s exactly at 30fps
} as const;

// ── Audio cue points (absolute frames) ───────────────────────
export const AUDIO = {
  CLICK_AT:  T.S4_START + 68,   // cursor clicks extension icon
  WHOOSH_AT: T.S4_START + 78,   // panel slides in
  DING_AT:   T.S6_START + 22,   // scrubber reveal begins
} as const;
