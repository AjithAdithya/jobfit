import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { sansFont } from "../fonts";
import { theme } from "../theme";

type ChipState = "idle" | "active" | "done";

interface Props {
  label:      string;
  state:      ChipState;
  enterFrame?: number;  // when the chip itself springs in
}

// Pill chip with three visual states.
// idle: transparent fill, muted border + text
// active: accent fill, ink text, subtle pulse glow
// done: surface fill, muted text, checkmark prefix
export const Chip: React.FC<Props> = ({ label, state, enterFrame = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sp = spring({ frame: Math.max(0, frame - enterFrame), fps, config: theme.spring });
  const scaleIn  = interpolate(sp, [0, 1], [0.7, 1]);
  const opacityIn = interpolate(sp, [0, 1], [0, 1]);

  // Active glow pulse (subtle scale oscillation)
  const pulse = state === "active"
    ? 1 + Math.sin((frame / fps) * Math.PI * 2 * 1.2) * 0.012
    : 1;

  const bgColor =
    state === "idle"   ? "transparent" :
    state === "active" ? theme.colors.accent :
    theme.colors.card;

  const textColor =
    state === "idle"   ? theme.colors.mute :
    state === "active" ? theme.colors.ink :
    theme.colors.mute;

  const borderColor =
    state === "idle"   ? theme.colors.dim :
    state === "active" ? theme.colors.accent :
    theme.colors.card;

  return (
    <div
      style={{
        display:         "inline-flex",
        alignItems:      "center",
        gap:             8,
        padding:         "8px 18px",
        borderRadius:    99,
        border:          `1.5px solid ${borderColor}`,
        backgroundColor: bgColor,
        opacity:         opacityIn,
        transform:       `scale(${scaleIn * pulse})`,
        boxShadow:       state === "active" ? `0 0 22px ${theme.colors.accent}44` : "none",
        transition:      "background-color 0.3s, border-color 0.3s, box-shadow 0.3s",
      }}
    >
      {state === "done" && (
        <span style={{ color: theme.colors.citrus, fontSize: 13, lineHeight: 1 }}>✓</span>
      )}
      {state === "active" && (
        <span
          style={{
            width: 7, height: 7, borderRadius: "50%",
            backgroundColor: theme.colors.citrus,
            display: "inline-block",
            flexShrink: 0,
          }}
        />
      )}
      <span
        style={{
          fontFamily:    sansFont,
          fontSize:      15,
          fontWeight:    state === "active" ? 600 : 400,
          color:         textColor,
          letterSpacing: "0.02em",
          whiteSpace:    "nowrap",
        }}
      >
        {label}
      </span>
    </div>
  );
};
