import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { monoFont, sansFont } from "../fonts";
import { theme } from "../theme";
import { T } from "../timings";
import { LogoMark } from "../components/LogoMark";
import { Headline } from "../components/Headline";
import { Caption } from "../components/Caption";
import { useSceneTransition } from "../utils";

export const S8CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tx    = useSceneTransition(T.S8_DUR);

  const LOGO_AT   = 0;
  const HEAD_AT   = 24;
  const URL_AT    = 100;
  const HANDLE_AT = 140;
  const BTN_AT    = 160;

  // Logo spring entrance
  const logoSp = spring({ frame: Math.max(0, frame - LOGO_AT), fps, config: theme.spring });
  const logoS  = interpolate(logoSp, [0, 1], [0.8, 1]);
  const logoO  = interpolate(logoSp, [0, 1], [0, 1]);

  // URL slide-up
  const urlSp = spring({ frame: Math.max(0, frame - URL_AT), fps, config: theme.spring });
  const urlO  = interpolate(urlSp, [0, 1], [0, 1]);
  const urlY  = interpolate(urlSp, [0, 1], [12, 0]);

  // Handle + button
  const btnO = interpolate(frame, [BTN_AT, BTN_AT + 24], [0, 1], { extrapolateRight: "clamp" });

  // Subtle gradient radial glow
  const glowO = interpolate(frame, [0, 40], [0, 1], { extrapolateRight: "clamp" });

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
      {/* Radial gradient glow — crimson core fading to bg */}
      <div
        style={{
          position:   "absolute",
          inset:      0,
          background: `radial-gradient(ellipse 900px 600px at 50% 50%, ${theme.colors.accent}22 0%, transparent 70%)`,
          opacity:    glowO,
          pointerEvents: "none",
        }}
      />

      {/* Top accent line */}
      <div
        style={{
          position:        "absolute",
          top:             0,
          left:            "50%",
          transform:       "translateX(-50%)",
          width:           interpolate(frame, [0, 30], [0, 400], { extrapolateRight: "clamp" }),
          height:          2,
          backgroundColor: theme.colors.accent,
          borderRadius:    1,
        }}
      />

      {/* Logo */}
      <div
        style={{
          opacity:   logoO,
          transform: `scale(${logoS})`,
          marginBottom: 48,
        }}
      >
        <LogoMark size={52} showAI />
      </div>

      {/* Main headline */}
      {frame >= HEAD_AT && (
        <Headline size={88} align="center" startFrame={0} charDelay={1.5}>
          {"Stop tailoring.\nStart shipping."}
        </Headline>
      )}

      {/* URL pill */}
      <div
        style={{
          marginTop:  52,
          opacity:    urlO,
          transform:  `translateY(${urlY}px)`,
          display:    "flex",
          alignItems: "center",
          gap:        16,
        }}
      >
        <div
          style={{
            backgroundColor: theme.colors.accent,
            borderRadius:    8,
            padding:         "14px 32px",
            fontFamily:      monoFont,
            fontSize:        18,
            fontWeight:      700,
            color:           theme.colors.ink,
            letterSpacing:   "0.02em",
          }}
        >
          jobfit-amber.vercel.app
        </div>
      </div>

      {/* Separator */}
      <div
        style={{
          marginTop:       32,
          width:           1,
          height:          40,
          backgroundColor: theme.colors.dim,
          opacity:         urlO,
        }}
      />

      {/* Handle + caption */}
      <div
        style={{
          marginTop:  16,
          opacity:    btnO,
          display:    "flex",
          flexDirection: "column",
          alignItems: "center",
          gap:        8,
        }}
      >
        <Caption size={12} color={theme.colors.mute} tracking="caps" uppercase>
          made by
        </Caption>
        <div
          style={{
            fontFamily:    sansFont,
            fontSize:      16,
            fontWeight:    500,
            color:         theme.colors.ink,
            letterSpacing: "0.01em",
          }}
        >
          ajith98.vercel.app
        </div>
      </div>

      {/* Bottom accent line */}
      <div
        style={{
          position:        "absolute",
          bottom:          0,
          left:            "50%",
          transform:       "translateX(-50%)",
          width:           interpolate(frame, [0, 30], [0, 400], { extrapolateRight: "clamp" }),
          height:          2,
          backgroundColor: theme.colors.accent,
          borderRadius:    1,
        }}
      />
    </AbsoluteFill>
  );
};
