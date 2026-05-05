import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { monoFont, sansFont } from "../fonts";
import { theme } from "../theme";
import { T } from "../timings";
import { ArchDiagram } from "../components/ArchDiagram";
import { GridBackground } from "../components/GridBackground";
import { Headline } from "../components/Headline";
import { Caption } from "../components/Caption";
import { useSceneTransition } from "../utils";

const STACK_ITEMS = [
  { label: "Manifest V3",        color: theme.colors.accent  },
  { label: "TypeScript",         color: theme.colors.accent2 },
  { label: "Claude Sonnet 4.5",  color: theme.colors.citrus  },
  { label: "Supabase",           color: theme.colors.success },
  { label: "LaTeX PDF",          color: theme.colors.mute    },
];

function StackBadge({ label, color, enterFrame }: { label: string; color: string; enterFrame: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sp  = spring({ frame: Math.max(0, frame - enterFrame), fps, config: theme.spring });
  const opac = interpolate(sp, [0, 1], [0, 1]);
  const ys   = interpolate(sp, [0, 1], [10, 0]);

  return (
    <div
      style={{
        opacity:   opac,
        transform: `translateY(${ys}px)`,
        display:   "inline-flex",
        alignItems: "center",
        gap:        8,
        backgroundColor: theme.colors.surface,
        border:     `1px solid ${theme.colors.dim}`,
        borderRadius: 6,
        padding:    "8px 16px",
      }}
    >
      <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: color, flexShrink: 0 }} />
      <span style={{ fontFamily: monoFont, fontSize: 13, fontWeight: 400, color: theme.colors.ink }}>
        {label}
      </span>
    </div>
  );
}

export const S7Credibility: React.FC = () => {
  const frame = useCurrentFrame();
  const tx    = useSceneTransition(T.S7_DUR);

  const DIAG_AT   = 20;
  const STACK_AT  = 110;
  const HEAD_AT   = 60;

  // Diagram container fade-in
  const diagO = interpolate(frame, [DIAG_AT, DIAG_AT + 18], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.bg,
        display:         "flex",
        flexDirection:   "column",
        alignItems:      "center",
        justifyContent:  "center",
        ...tx.style,
      }}
    >
      <GridBackground />

      {/* Eyebrow */}
      <Caption
        size={11}
        weight={600}
        color={theme.colors.mute}
        tracking="caps"
        uppercase
        style={{ marginBottom: 32 }}
      >
        How it works
      </Caption>

      {/* Architecture diagram */}
      <div style={{ opacity: diagO }}>
        <ArchDiagram />
      </div>

      {/* "Built right." headline */}
      {frame >= HEAD_AT && (
        <div style={{ marginTop: 56 }}>
          <Headline size={72} align="center" startFrame={0} charDelay={2}>
            Built right.
          </Headline>
        </div>
      )}

      {/* Tech stack badges */}
      <div
        style={{
          display:    "flex",
          flexWrap:   "wrap",
          gap:        12,
          marginTop:  40,
          justifyContent: "center",
          maxWidth:   800,
        }}
      >
        {STACK_ITEMS.map((item, i) => (
          <StackBadge
            key={item.label}
            label={item.label}
            color={item.color}
            enterFrame={STACK_AT + i * 14}
          />
        ))}
      </div>

      {/* Sub-caption */}
      <Caption
        size={13}
        color={theme.colors.mute}
        align="center"
        style={{
          marginTop: 36,
          opacity: frame >= STACK_AT + STACK_ITEMS.length * 14 ? 1 : 0,
        }}
      >
        Runs entirely in your browser · Zero data stored · Open API
      </Caption>
    </AbsoluteFill>
  );
};
