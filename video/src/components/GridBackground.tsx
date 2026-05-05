import { AbsoluteFill } from "remotion";
import { theme } from "../theme";

interface Props {
  size?: number;   // grid cell size in px
  opacity?: number;
  dot?: boolean;   // dot grid instead of line grid
}

// CHOICE: 48px cells with 1px hairlines — matches the dotted grid aesthetic of Linear/Vercel dashboards.
export const GridBackground: React.FC<Props> = ({ size = 48, opacity = 1, dot = false }) => {
  const stroke = theme.colors.grid;

  const pattern = dot ? (
    <pattern id="grid-pat" x="0" y="0" width={size} height={size} patternUnits="userSpaceOnUse">
      <circle cx={size / 2} cy={size / 2} r="1" fill={stroke} />
    </pattern>
  ) : (
    <pattern id="grid-pat" x="0" y="0" width={size} height={size} patternUnits="userSpaceOnUse">
      <path d={`M ${size} 0 L 0 0 0 ${size}`} fill="none" stroke={stroke} strokeWidth="1" />
    </pattern>
  );

  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity }}>
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>{pattern}</defs>
        <rect width="100%" height="100%" fill="url(#grid-pat)" />
      </svg>
    </AbsoluteFill>
  );
};
