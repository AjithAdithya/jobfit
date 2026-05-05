import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { displayFont } from "../fonts";
import { theme } from "../theme";
import { T } from "../timings";
import { useSceneTransition } from "../utils";

// CHOICE: 112px Fraunces at −3% tracking fills ~780px — leaves safe margin on both sides
// at 1080 wide. "tailored." is 2% larger than the first line for optical emphasis.

export const S1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tx = useSceneTransition(T.S1_DUR);

  // ── Typewriter for "Your resume is generic." ───────────────
  const HEADLINE = "Your resume is generic.";
  const chars    = Array.from(HEADLINE);
  // 36 chars would take 36 * 1.3 ≈ 47 frames; all done by frame 47
  const visibleCount = Math.min(
    chars.length,
    Math.floor(interpolate(frame, [2, 42], [0, chars.length], { extrapolateRight: "clamp" }))
  );

  // ── Strikethrough line over "generic" ───────────────────────
  // "Your resume is " is 16 chars, "generic" is 7 chars
  // Strike starts at frame 46, done by frame 66
  const strikeProgress = interpolate(frame, [46, 66], [0, 1], {
    extrapolateLeft:  "clamp",
    extrapolateRight: "clamp",
  });

  // ── "tailored." springs up in accent color ───────────────────
  const tailoredSp = spring({ frame: Math.max(0, frame - 60), fps, config: theme.spring });
  const tailoredY  = interpolate(tailoredSp, [0, 1], [28, 0]);
  const tailoredO  = interpolate(tailoredSp, [0, 1], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        ...tx.style,
      }}
    >
      {/* Headline block */}
      <div style={{ textAlign: "center", userSelect: "none" }}>

        {/* "Your resume is generic." — typed in, with strikethrough over "generic" */}
        <div
          style={{
            fontFamily:    displayFont,
            fontSize:      112,
            fontWeight:    900,
            lineHeight:    1.04,
            letterSpacing: "-0.03em",
            color:         theme.colors.ink,
            display:       "flex",
            alignItems:    "center",
            justifyContent: "center",
            flexWrap:      "wrap",
            gap:           0,
          }}
        >
          {/* "Your resume is " */}
          <span>{chars.slice(0, Math.min(visibleCount, 16)).join("")}</span>

          {/* "generic" with animated strikethrough */}
          <span style={{ position: "relative", display: "inline-block" }}>
            <span style={{ opacity: visibleCount >= 23 ? 1 : visibleCount > 16 ? (visibleCount - 16) / 7 : 0 }}>
              generic
            </span>
            {/* Strikethrough bar */}
            <div
              style={{
                position: "absolute",
                top:      "50%",
                left:     0,
                height:   5,
                width:    `${strikeProgress * 100}%`,
                backgroundColor: theme.colors.ink,
                transform:       "translateY(-50%)",
                borderRadius:    2,
              }}
            />
          </span>

          {/* "." */}
          <span style={{ opacity: visibleCount >= 24 ? 1 : 0 }}>.</span>
        </div>

        {/* "tailored." in accent — springs up below */}
        <div
          style={{
            fontFamily:    displayFont,
            fontSize:      116,   // CHOICE: 4px larger — optical hierarchy hint
            fontWeight:    900,
            lineHeight:    1.04,
            letterSpacing: "-0.03em",
            color:         theme.colors.accent,
            opacity:       tailoredO,
            transform:     `translateY(${tailoredY}px)`,
            marginTop:     8,
          }}
        >
          tailored.
        </div>
      </div>
    </AbsoluteFill>
  );
};
