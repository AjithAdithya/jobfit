import { sansFont, monoFont } from "../fonts";
import { theme } from "../theme";

interface Props {
  children:   React.ReactNode;
  size?:      number;
  weight?:    400 | 500 | 600 | 700;
  color?:     string;
  align?:     React.CSSProperties["textAlign"];
  tracking?:  "tight" | "normal" | "wide" | "caps";
  mono?:      boolean;
  uppercase?: boolean;
  style?:     React.CSSProperties;
}

const TRACKING = {
  tight:  "-0.02em",
  normal: "0em",
  wide:   "0.04em",
  caps:   "0.14em",
} as const;

export const Caption: React.FC<Props> = ({
  children, size = 16, weight = 400, color, align = "left",
  tracking = "normal", mono = false, uppercase = false, style,
}) => (
  <p
    style={{
      fontFamily:    mono ? monoFont : sansFont,
      fontSize:      size,
      fontWeight:    weight,
      color:         color ?? theme.colors.mute,
      letterSpacing: TRACKING[tracking],
      textAlign:     align,
      textTransform: uppercase ? "uppercase" : "none",
      margin: 0,
      lineHeight: 1.55,
      ...style,
    }}
  >
    {children}
  </p>
);
