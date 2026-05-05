import { interpolate, useCurrentFrame, Easing } from "remotion";
import { theme } from "../theme";

interface Waypoint { x: number; y: number; frame: number }

interface Props {
  waypoints:   Waypoint[];   // absolute positions in the 1080×1080 canvas
  clickFrame?: number;       // frame at which the click pulse fires
  scale?:      number;
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

// SVG pointer cursor that moves between waypoints and pulses on click.
export const Cursor: React.FC<Props> = ({ waypoints, clickFrame, scale = 1 }) => {
  const frame = useCurrentFrame();

  // Compute position by interpolating between waypoints
  let x = waypoints[0].x;
  let y = waypoints[0].y;

  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    if (frame >= a.frame && frame <= b.frame) {
      const t = interpolate(frame, [a.frame, b.frame], [0, 1], {
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
        extrapolateLeft:  "clamp",
        extrapolateRight: "clamp",
      });
      x = lerp(a.x, b.x, t);
      y = lerp(a.y, b.y, t);
      break;
    } else if (frame > b.frame) {
      x = b.x;
      y = b.y;
    }
  }

  // Click pulse
  const isClicking = clickFrame !== undefined &&
    frame >= clickFrame && frame <= clickFrame + 16;
  const clickT = clickFrame
    ? interpolate(frame, [clickFrame, clickFrame + 16], [0, 1], {
        extrapolateLeft:  "clamp",
        extrapolateRight: "clamp",
      })
    : 0;
  const cursorScale = isClicking ? interpolate(clickT, [0, 0.3, 1], [1, 0.82, 1]) : 1;
  const ringOpacity = isClicking ? interpolate(clickT, [0, 0.4, 1], [0, 0.8, 0]) : 0;
  const ringScale   = isClicking ? interpolate(clickT, [0, 1], [1, 2.2]) : 1;

  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      {/* Click pulse ring */}
      <circle
        r="18"
        fill="none"
        stroke={theme.colors.accent}
        strokeWidth="2"
        opacity={ringOpacity}
        transform={`scale(${ringScale})`}
      />
      {/* Cursor arrow */}
      <g transform={`scale(${cursorScale})`}>
        <path
          d="M0 0 L0 22 L6 16 L10 24 L13 23 L9 15 L17 15 Z"
          fill={theme.colors.ink}
          stroke={theme.colors.bg}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </g>
    </g>
  );
};
