import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { displayFont } from "../fonts";
import { theme } from "../theme";

interface Props {
  children:   string;
  size?:      number;
  color?:     string;
  align?:     React.CSSProperties["textAlign"];
  startFrame?: number;  // delay within current Sequence before chars appear
  charDelay?:  number;  // frames between each character reveal (default 1.5)
  style?:     React.CSSProperties;
}

// Per-character stagger typewriter with a container spring entrance.
// CHOICE: Fraunces 900 at −3% tracking. Change size to 72 for sub-headline use.
export const Headline: React.FC<Props> = ({
  children, size = 100, color, align = "center",
  startFrame = 0, charDelay = 1.5, style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const chars   = Array.from(children); // Unicode-safe split
  const ink     = color ?? theme.colors.ink;

  // Container enters as a spring so the block lifts in confidently
  const sp = spring({ frame: Math.max(0, frame - startFrame), fps, config: theme.spring });
  const containerY = interpolate(sp, [0, 1], [18, 0]);
  const containerO = interpolate(sp, [0, 1], [0, 1]);

  return (
    <div
      style={{
        fontFamily:    displayFont,
        fontSize:      size,
        fontWeight:    900,
        lineHeight:    1.04,
        letterSpacing: "-0.03em",   // CHOICE: tight tracking — editorial feel
        textAlign:     align,
        color:         ink,
        opacity:       containerO,
        transform:     `translateY(${containerY}px)`,
        ...style,
      }}
    >
      {chars.map((ch, i) => {
        const appear = startFrame + i * charDelay;
        const chO = interpolate(frame, [appear, appear + 6], [0, 1], {
          extrapolateLeft:  "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <span key={i} style={{ opacity: chO, display: "inline", whiteSpace: "pre" }}>
            {ch}
          </span>
        );
      })}
    </div>
  );
};
