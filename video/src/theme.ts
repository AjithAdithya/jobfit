// CHOICE: Using JobFit's actual design-system tokens rather than generic dark-SaaS palette.
// Cream ink instead of pure white gives the editorial warmth of the LinkedIn/Vercel aesthetic.
// Accent = crimson-500 (#C01414), accent2 = sky (#5DD4FF) — warm/cool contrast for AI moments.

export const theme = {
  colors: {
    bg:      "#0A0B0E",   // ink-900 — actual dark canvas from the extension
    surface: "#14161B",   // ink-800
    card:    "#24272D",   // ink-700
    ink:     "#EDE9E3",   // cream — editorial off-white
    mute:    "#7B8088",   // ink-400
    dim:     "#3A3E46",   // ink-600
    accent:  "#C01414",   // crimson-500 — JobFit hero red
    accent2: "#5DD4FF",   // sky — AI / data accent
    citrus:  "#D7FF3A",   // citrus — highlight / success
    flare:   "#FF4D2E",   // flare — warning / energy
    success: "#22C55E",
    grid:    "rgba(237,233,227,0.055)",
  },
  fonts: {
    display: "Fraunces",        // editorial serif headlines
    sans:    "Inter",           // UI, captions
    mono:    "JetBrains Mono",  // code, streaming text
  },
  // Raw bezier values — use with Easing.bezier(...theme.ease.enter)
  ease: {
    standard: [0.2,  0.8,  0.2,  1   ] as [number,number,number,number],
    enter:    [0.16, 1,    0.3,  1   ] as [number,number,number,number],
    exit:     [0.7,  0,    0.84, 0   ] as [number,number,number,number],
  },
  // Enforced spring config — every entrance uses these unless noted
  spring: { damping: 200, stiffness: 120, mass: 0.6 },
  // Safe margin from all edges (important for LinkedIn mobile crop)
  safe: 72,
} as const;
