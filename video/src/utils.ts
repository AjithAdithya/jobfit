import { interpolate, useCurrentFrame, Easing } from "remotion";
import { theme } from "./theme";

// Returns opacity + transform style for smooth scene enter/exit.
// Every scene wraps its root in <AbsoluteFill style={tx.style}>.
export function useSceneTransition(sceneDur: number, enterDur = 10, exitDur = 10) {
  const frame = useCurrentFrame();

  const entO = interpolate(frame, [0, enterDur], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.bezier(...theme.ease.enter),
  });
  const entS = interpolate(frame, [0, enterDur], [1.025, 1], { extrapolateRight: "clamp" });
  const entY = interpolate(frame, [0, enterDur], [8, 0], { extrapolateRight: "clamp" });

  const exO = interpolate(frame, [sceneDur - exitDur, sceneDur], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...theme.ease.exit),
  });
  const exS = interpolate(frame, [sceneDur - exitDur, sceneDur], [1, 1.025], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exY = interpolate(frame, [sceneDur - exitDur, sceneDur], [0, -8], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const entering = frame < enterDur;
  const exiting  = frame >= sceneDur - exitDur;

  const scale = entering ? entS : exiting ? exS : 1;
  const ty    = entering ? entY : exiting ? exY : 0;
  const opacity = Math.min(entO, exO);

  return {
    style: {
      opacity,
      transform: `scale(${scale}) translateY(${ty}px)`,
    } as React.CSSProperties,
  };
}

// Clamp helper
export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
