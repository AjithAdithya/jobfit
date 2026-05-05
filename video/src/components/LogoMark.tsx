import { theme } from "../theme";
import { displayFont, sansFont } from "../fonts";

interface Props {
  size?:     number;   // base font-size in px
  scale?:    number;
  opacity?:  number;
  inverted?: boolean;  // dark text on light bg
  showAI?:   boolean;  // show "AI" suffix tag
}

// CHOICE: Fraunces 900 weight, −3% tracking. "Job" in ink, "fit" in accent.
// The small "AI" tag in Inter 400 at 38% opacity reads as a qualifier, not decoration.
// Replace with actual brand SVG by swapping the JSX — dimensions are identical.
export const LogoMark: React.FC<Props> = ({
  size = 36, scale = 1, opacity = 1, inverted = false, showAI = true,
}) => {
  const inkColor = inverted ? theme.colors.bg : theme.colors.ink;
  const sz = size * scale;

  return (
    <div
      style={{
        opacity,
        display: "inline-flex",
        alignItems: "baseline",
        lineHeight: 1,
        userSelect: "none",
      }}
    >
      <span
        style={{
          fontFamily: displayFont,
          fontSize:   sz,
          fontWeight: 900,
          color:      inkColor,
          letterSpacing: "-0.03em",
        }}
      >
        Job
      </span>
      <span
        style={{
          fontFamily: displayFont,
          fontSize:   sz,
          fontWeight: 900,
          color:      theme.colors.accent,
          letterSpacing: "-0.03em",
        }}
      >
        fit
      </span>
      {showAI && (
        <span
          style={{
            fontFamily: sansFont,
            fontSize:   sz * 0.28,
            fontWeight: 400,
            color:      theme.colors.mute,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginLeft: sz * 0.14,
            alignSelf: "flex-end",
            marginBottom: sz * 0.06,
            opacity: 0.75,
          }}
        >
          AI
        </span>
      )}
    </div>
  );
};
