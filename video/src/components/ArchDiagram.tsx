import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { sansFont, monoFont } from "../fonts";
import { theme } from "../theme";

interface Node { label: string; sub?: string; x: number; y: number }

const NODES: Node[] = [
  { label: "Browser",   sub: "Chrome MV3",     x: 160,  y: 0  },
  { label: "Extension", sub: "TypeScript",      x: 540,  y: 0  },
  { label: "Claude API",sub: "Sonnet 4.5",      x: 920,  y: 0  },
];

const NODE_W = 180;
const NODE_H = 72;
const ARROW_Y = NODE_H / 2;

function NodeBox({ node, enterFrame }: { node: Node; enterFrame: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sp  = spring({ frame: Math.max(0, frame - enterFrame), fps, config: theme.spring });
  const opac = interpolate(sp, [0, 1], [0, 1]);
  const ys   = interpolate(sp, [0, 1], [14, 0]);

  return (
    <g transform={`translate(${node.x - NODE_W / 2}, ${node.y - NODE_H / 2}) translate(0, ${ys})`} opacity={opac}>
      <rect
        width={NODE_W} height={NODE_H}
        rx="8"
        fill={theme.colors.surface}
        stroke={theme.colors.dim}
        strokeWidth="1.5"
      />
      <text
        x={NODE_W / 2} y={NODE_H / 2 - 4}
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily={sansFont}
        fontSize="15"
        fontWeight="600"
        fill={theme.colors.ink}
      >
        {node.label}
      </text>
      {node.sub && (
        <text
          x={NODE_W / 2} y={NODE_H / 2 + 15}
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily={monoFont}
          fontSize="11"
          fill={theme.colors.mute}
        >
          {node.sub}
        </text>
      )}
    </g>
  );
}

interface PathProps { x1: number; x2: number; y: number; drawStart: number; drawEnd: number; dotStart: number }

function AnimatedPath({ x1, x2, y, drawStart, drawEnd, dotStart }: PathProps) {
  const frame = useCurrentFrame();
  const len   = x2 - x1;

  // Stroke draws in (dashoffset from len → 0)
  const drawn = interpolate(frame, [drawStart, drawEnd], [0, len], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const dashOffset = len - drawn;

  // Traveling dot position
  const dotT = interpolate(frame, [dotStart, dotStart + 50], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const dotLoopT = ((frame - dotStart) % 60) / 60;
  const dotX = x1 + (x2 - x1) * (frame >= dotStart ? dotLoopT : 0);

  return (
    <g>
      <line
        x1={x1} y1={y} x2={x2} y2={y}
        stroke={theme.colors.dim}
        strokeWidth="1.5"
        strokeDasharray={len}
        strokeDashoffset={dashOffset}
      />
      {/* Arrowhead */}
      {drawn > len * 0.9 && (
        <polygon
          points={`${x2},${y} ${x2 - 8},${y - 5} ${x2 - 8},${y + 5}`}
          fill={theme.colors.accent}
        />
      )}
      {/* Traveling dot */}
      {frame >= dotStart && (
        <circle cx={dotX} cy={y} r="4" fill={theme.colors.accent} opacity="0.9" />
      )}
    </g>
  );
}

// Full architecture diagram — used in S7.
// Nodes enter sequentially; paths draw after; dots travel continuously.
export const ArchDiagram: React.FC = () => {
  const centerY = 0;
  const leftEdge  = (x: number) => x + NODE_W / 2;
  const rightEdge = (x: number) => x - NODE_W / 2;

  return (
    <svg
      width="1080"
      height="160"
      viewBox="0 0 1080 160"
      style={{ overflow: "visible" }}
    >
      <g transform="translate(0, 80)">
        {/* Paths */}
        <AnimatedPath
          x1={leftEdge(NODES[0].x)} x2={rightEdge(NODES[1].x)} y={ARROW_Y - NODE_H / 2}
          drawStart={30} drawEnd={70} dotStart={80}
        />
        <AnimatedPath
          x1={leftEdge(NODES[1].x)} x2={rightEdge(NODES[2].x)} y={ARROW_Y - NODE_H / 2}
          drawStart={55} drawEnd={95} dotStart={110}
        />

        {/* Nodes */}
        {NODES.map((n, i) => (
          <NodeBox key={n.label} node={n} enterFrame={i * 18} />
        ))}
      </g>
    </svg>
  );
};
