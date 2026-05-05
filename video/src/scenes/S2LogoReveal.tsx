import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { displayFont, sansFont } from "../fonts";
import { theme } from "../theme";
import { T } from "../timings";
import { LogoMark } from "../components/LogoMark";
import { useSceneTransition } from "../utils";

export const S2LogoReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tx = useSceneTransition(T.S2_DUR);

  // Logo springs in from slightly below
  const logoSp   = spring({ frame, fps, config: theme.spring });
  const logoScale = interpolate(logoSp, [0, 1], [0.72, 1]);
  const logoY     = interpolate(logoSp, [0, 1], [24, 0]);
  const logoO     = interpolate(logoSp, [0, 1], [0, 1]);

  // Tagline fades in after logo settles
  const tagO = interpolate(frame, [22, 40], [0, 1], { extrapolateRight: "clamp" });
  const tagY = interpolate(frame, [22, 42], [10, 0], { extrapolateRight: "clamp" });

  // Accent underline extends under "Jobfit"
  const lineW = interpolate(frame, [12, 32], [0, 120], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.bg,
        display:         "flex",
        flexDirection:   "column",
        alignItems:      "center",
        justifyContent:  "center",
        ...tx.style,
      }}
    >
      {/* Logo */}
      <div
        style={{
          opacity:   logoO,
          transform: `scale(${logoScale}) translateY(${logoY}px)`,
          display:   "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}
      >
        <LogoMark size={82} showAI />

        {/* Accent underline */}
        <div
          style={{
            width:  lineW,
            height: 2,
            backgroundColor: theme.colors.accent,
            borderRadius: 1,
          }}
        />
      </div>

      {/* Tagline */}
      <p
        style={{
          fontFamily:    sansFont,
          fontSize:      20,
          fontWeight:    400,
          color:         theme.colors.mute,
          letterSpacing: "0.01em",
          lineHeight:    1.5,
          textAlign:     "center",
          marginTop:     32,
          maxWidth:      520,
          opacity:       tagO,
          transform:     `translateY(${tagY}px)`,
        }}
      >
        Resume tailoring, in the tab you're already in.
      </p>
    </AbsoluteFill>
  );
};
