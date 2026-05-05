import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { T } from "../timings";
import { Headline } from "../components/Headline";
import { useSceneTransition } from "../utils";

// CHOICE: ext-04-match-resume.png = "before" (generic resume state),
// ext-05-resume-preview.png = "after" (tailored, LaTeX-rendered).
// Drop public/screenshots/04-result-diff.png to replace the "before" side.
const BEFORE_SHOT = "screenshots/ext-04-match-resume.png";
const AFTER_SHOT  = "screenshots/ext-05-resume-preview.png";

// Approximate y-positions of changed bullets inside the 1080-tall render
// These rectangles highlight diffs as the scrubber reveals the "after" side.
// CHOICE: semi-transparent green overlays — subtle enough to be legible without obscuring the UI.
const DIFF_HIGHLIGHTS = [
  { y: 220, h: 32, type: "added"   as const, revealAt: 0.15 },
  { y: 298, h: 32, type: "added"   as const, revealAt: 0.30 },
  { y: 376, h: 32, type: "changed" as const, revealAt: 0.45 },
  { y: 454, h: 32, type: "added"   as const, revealAt: 0.60 },
  { y: 532, h: 32, type: "changed" as const, revealAt: 0.72 },
];

export const S6Result: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tx      = useSceneTransition(T.S6_DUR);

  const SCRUB_START = 20;
  const SCRUB_END   = 290;
  const HEAD_AT     = 295;

  // Scrubber travels full width
  const scrubberPct = interpolate(frame, [SCRUB_START, SCRUB_END], [0, 1], {
    extrapolateLeft:  "clamp",
    extrapolateRight: "clamp",
  });
  const scrubberX = scrubberPct * 1080;

  // Headline springs in at the end
  const headSp = spring({ frame: Math.max(0, frame - HEAD_AT), fps, config: theme.spring });
  const headO  = interpolate(headSp, [0, 1], [0, 1]);
  const headS  = interpolate(headSp, [0, 1], [0.92, 1]);

  return (
    <AbsoluteFill style={{ ...tx.style }}>

      {/* ── Before screenshot (full width, underneath) ─────── */}
      <AbsoluteFill>
        <Img
          src={staticFile(BEFORE_SHOT)}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center" }}
        />
        {/* Before label */}
        <div
          style={{
            position:        "absolute",
            top:             theme.safe,
            left:            theme.safe,
            backgroundColor: `${theme.colors.bg}CC`,
            border:          `1px solid ${theme.colors.dim}`,
            borderRadius:    6,
            padding:         "6px 14px",
            fontSize:        12,
            fontWeight:      600,
            color:           theme.colors.mute,
            letterSpacing:   "0.1em",
            textTransform:   "uppercase",
          }}
        >
          Before
        </div>
      </AbsoluteFill>

      {/* ── After screenshot (revealed left of scrubber) ────── */}
      <AbsoluteFill
        style={{ clipPath: `inset(0 ${1080 - scrubberX}px 0 0)` }}
      >
        <Img
          src={staticFile(AFTER_SHOT)}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center" }}
        />

        {/* Diff highlight overlays */}
        {DIFF_HIGHLIGHTS.map((d, i) => {
          const revealed = scrubberPct > d.revealAt;
          const diffO = revealed
            ? interpolate(frame, [SCRUB_START + d.revealAt * (SCRUB_END - SCRUB_START), SCRUB_START + d.revealAt * (SCRUB_END - SCRUB_START) + 12], [0, 1], {
                extrapolateLeft:  "clamp",
                extrapolateRight: "clamp",
              })
            : 0;
          return (
            <div
              key={i}
              style={{
                position:        "absolute",
                left:            48,
                right:           48,
                top:             d.y,
                height:          d.h,
                backgroundColor: d.type === "added" ? "rgba(34,197,94,0.22)" : "rgba(93,212,255,0.22)",
                borderLeft:      `3px solid ${d.type === "added" ? theme.colors.success : theme.colors.accent2}`,
                borderRadius:    "0 4px 4px 0",
                opacity:         diffO,
              }}
            />
          );
        })}

        {/* After label */}
        <div
          style={{
            position:        "absolute",
            top:             theme.safe,
            left:            theme.safe,
            backgroundColor: theme.colors.accent,
            borderRadius:    6,
            padding:         "6px 14px",
            fontSize:        12,
            fontWeight:      700,
            color:           theme.colors.ink,
            letterSpacing:   "0.1em",
            textTransform:   "uppercase",
            opacity:         scrubberPct > 0.05 ? 1 : 0,
          }}
        >
          After
        </div>
      </AbsoluteFill>

      {/* ── Scrubber line ─────────────────────────────────── */}
      <div
        style={{
          position:        "absolute",
          left:            scrubberX - 1,
          top:             0,
          bottom:          0,
          width:           2,
          backgroundColor: theme.colors.ink,
          boxShadow:       `0 0 12px ${theme.colors.ink}88`,
          opacity:         scrubberPct > 0 && scrubberPct < 0.99 ? 1 : 0,
        }}
      />
      {/* Scrubber handle */}
      <div
        style={{
          position:        "absolute",
          left:            scrubberX - 16,
          top:             "50%",
          transform:       "translateY(-50%)",
          width:           32,
          height:          32,
          borderRadius:    "50%",
          backgroundColor: theme.colors.ink,
          opacity:         scrubberPct > 0 && scrubberPct < 0.99 ? 1 : 0,
          display:         "flex",
          alignItems:      "center",
          justifyContent:  "center",
        }}
      >
        <span style={{ color: theme.colors.bg, fontSize: 12, userSelect: "none" }}>↔</span>
      </div>

      {/* ── Overlay headline ──────────────────────────────── */}
      {frame >= HEAD_AT && (
        <div
          style={{
            position:   "absolute",
            inset:      0,
            display:    "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: `${theme.colors.bg}BB`,
            opacity:    headO,
            transform:  `scale(${headS})`,
          }}
        >
          <Headline size={96} align="center" startFrame={0} charDelay={2}>
            Same you. Sharper story.
          </Headline>
        </div>
      )}
    </AbsoluteFill>
  );
};
