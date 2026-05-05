import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { monoFont, sansFont } from "../fonts";
import { theme } from "../theme";
import { T } from "../timings";
import { Chip } from "../components/Chip";
import { useSceneTransition } from "../utils";

// CHOICE: ext-03-match-score.png used for the "tailoring" scene — it shows the
// analysis result UI which implies the AI has done its work.
// Swap public/screenshots/03-tailoring.png for a loading/streaming UI if available.
const TAILORING_SHOT = "screenshots/ext-03-match-score.png";

// Fake streaming tokens — appears character by character in JetBrains Mono
const STREAM_TEXT = [
  "→ Reading job description...",
  "",
  "✓ Extracted 24 core requirements",
  "✓ Mapped 19 to your experience",
  "",
  "→ Rewriting experience bullets...",
  "  • Senior Product Designer → leading 0→1 design",
  "  • Adding: data-driven design, A/B testing",
  "  • Strengthening: stakeholder alignment",
  "",
  "→ Optimising ATS keyword density...",
  "",
  "✓ Resume tailored. Match score: 84 / 100",
].join("\n");

type ChipState = "idle" | "active" | "done";
function chipState(frame: number, start: number, end: number): ChipState {
  if (frame < start) return "idle";
  if (frame >= end)  return "done";
  return "active";
}

export const S5Magic: React.FC = () => {
  const frame = useCurrentFrame();
  const tx    = useSceneTransition(T.S5_DUR);

  const CHIP_1_RANGE: [number, number] = [0,   120];
  const CHIP_2_RANGE: [number, number] = [120, 240];
  const CHIP_3_RANGE: [number, number] = [240, 358];

  // Streaming text — reveals characters over first 280 frames
  const charsVisible = Math.floor(
    interpolate(frame, [8, 280], [0, STREAM_TEXT.length], {
      extrapolateLeft:  "clamp",
      extrapolateRight: "clamp",
    })
  );
  const visibleText = STREAM_TEXT.slice(0, charsVisible);

  // Cursor blink (every 20 frames)
  const cursorVisible = frame % 20 < 10;

  // Background screenshot fades in softly
  const bgO = interpolate(frame, [0, 20], [0, 0.22], { extrapolateRight: "clamp" });

  // Panel entrance
  const panelO = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: "clamp" });
  const panelY = interpolate(frame, [0, 14], [12, 0], { extrapolateRight: "clamp" });

  // "Powered by Claude" appears at frame 30
  const claudeO = interpolate(frame, [30, 50], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: theme.colors.bg, ...tx.style }}>

      {/* Dim background screenshot for context */}
      <AbsoluteFill style={{ opacity: bgO }}>
        <Img
          src={staticFile(TAILORING_SHOT)}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center" }}
        />
      </AbsoluteFill>

      {/* Dark scrim over the screenshot */}
      <AbsoluteFill style={{ backgroundColor: `${theme.colors.bg}CC` }} />

      {/* Main panel */}
      <AbsoluteFill
        style={{
          display:        "flex",
          flexDirection:  "column",
          alignItems:     "center",
          justifyContent: "center",
          padding:        theme.safe,
        }}
      >
        {/* Status chips */}
        <div
          style={{
            display: "flex",
            gap:     16,
            marginBottom: 36,
            opacity: panelO,
            transform: `translateY(${panelY}px)`,
          }}
        >
          <Chip label="Reading JD"       state={chipState(frame, ...CHIP_1_RANGE)} enterFrame={4}  />
          <Chip label="Matching skills"  state={chipState(frame, ...CHIP_2_RANGE)} enterFrame={28} />
          <Chip label="Rewriting bullets"state={chipState(frame, ...CHIP_3_RANGE)} enterFrame={52} />
        </div>

        {/* Streaming terminal */}
        <div
          style={{
            width:           760,
            minHeight:       320,
            backgroundColor: theme.colors.surface,
            border:          `1px solid ${theme.colors.dim}`,
            borderRadius:    10,
            padding:         28,
            opacity:         panelO,
            transform:       `translateY(${panelY}px)`,
            boxShadow:       "0 40px 100px rgba(0,0,0,0.5)",
          }}
        >
          {/* Header bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            {(["#FF5F57","#FFBD2E","#28C840"] as const).map(c => (
              <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: c }} />
            ))}
            <span style={{ fontFamily: monoFont, fontSize: 11, color: theme.colors.mute, marginLeft: 8 }}>
              jobfit — tailoring resume…
            </span>
          </div>

          {/* Streaming output */}
          <pre
            style={{
              fontFamily:  monoFont,
              fontSize:    13,
              lineHeight:  1.7,
              color:       theme.colors.citrus,
              margin:      0,
              whiteSpace:  "pre-wrap",
              wordBreak:   "break-word",
            }}
          >
            {visibleText}
            {cursorVisible && charsVisible < STREAM_TEXT.length && (
              <span style={{ color: theme.colors.accent }}>▌</span>
            )}
          </pre>
        </div>

        {/* "Powered by Claude" watermark */}
        <p
          style={{
            fontFamily:    monoFont,
            fontSize:      11,
            color:         theme.colors.mute,
            marginTop:     18,
            opacity:       claudeO,
            letterSpacing: "0.06em",
          }}
        >
          powered by Claude · claude-sonnet-4-5 · jobfit-amber.vercel.app
        </p>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
