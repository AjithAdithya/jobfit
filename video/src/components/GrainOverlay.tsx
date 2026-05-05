import { AbsoluteFill, useCurrentFrame } from "remotion";

// Baked SVG fractalNoise grain that updates every frame for film-grain feel.
// Sits above everything at pointer-events:none; mixBlendMode overlay keeps it subtle.
export const GrainOverlay: React.FC<{ opacity?: number }> = ({ opacity = 0.065 }) => {
  const frame = useCurrentFrame();
  const seed = frame % 97; // prime cycle keeps it from repeating obviously
  const id = `g${frame}`;

  return (
    <AbsoluteFill
      style={{ pointerEvents: "none", zIndex: 999, mixBlendMode: "overlay" as const, opacity }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
        style={{ display: "block" }}
      >
        <defs>
          <filter id={id} x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.72"
              numOctaves="4"
              seed={seed}
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
        <rect width="100%" height="100%" filter={`url(#${id})`} />
      </svg>
    </AbsoluteFill>
  );
};
