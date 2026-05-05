import { AbsoluteFill, useCurrentFrame } from "remotion";
import { theme } from "../theme";

interface Props { totalFrames: number }

// 1px progress bar at the very bottom of the frame, accent color, 30% opacity.
export const ProgressBar: React.FC<Props> = ({ totalFrames }) => {
  const frame = useCurrentFrame();
  const pct   = Math.min(frame / totalFrames, 1) * 100;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* Track */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left:   0,
          right:  0,
          height: 2,
          backgroundColor: "rgba(255,255,255,0.08)",
        }}
      />
      {/* Fill */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left:   0,
          width:  `${pct}%`,
          height: 2,
          backgroundColor: theme.colors.accent,
          opacity: 0.35,
        }}
      />
    </AbsoluteFill>
  );
};
