import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { sansFont } from "../fonts";
import { theme } from "../theme";
import { T } from "../timings";
import { BrowserChrome } from "../components/BrowserChrome";
import { Caption } from "../components/Caption";
import { useSceneTransition } from "../utils";

// Screenshot mapping: ext-01-home.png used as the "job in browser" scene.
// For a more literal job-posting screenshot, drop public/screenshots/01-job-posting.png
// and update the src below — no other code changes needed.
const JOB_SCREENSHOT = "screenshots/ext-01-home.png";

interface FloatingCallout {
  label:     string;
  icon:      string;
  enterFrame: number;
  x:         number;  // offset from browser left edge
  y:         number;  // offset from browser top edge
  from:      "left" | "right" | "top";
}

const CALLOUTS: FloatingCallout[] = [
  { label: "200+ requirements",    icon: "📋", enterFrame: 28,  x: -180, y: 80,  from: "left"  },
  { label: "ATS keyword matching", icon: "🔍", enterFrame: 68,  x: 740,  y: 160, from: "right" },
  { label: "Every job is different",icon: "⚡", enterFrame: 110, x: -180, y: 300, from: "left"  },
];

function CalloutBubble({ callout }: { callout: FloatingCallout }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sp  = spring({ frame: Math.max(0, frame - callout.enterFrame), fps, config: theme.spring });
  const dx  = callout.from === "right" ? 40 : callout.from === "left" ? -40 : 0;
  const dy  = callout.from === "top"   ? -30 : 0;
  const ox  = interpolate(sp, [0, 1], [dx, 0]);
  const oy  = interpolate(sp, [0, 1], [dy, 0]);
  const op  = interpolate(sp, [0, 1], [0, 1]);

  return (
    <div
      style={{
        position:        "absolute",
        left:            callout.x,
        top:             callout.y,
        opacity:         op,
        transform:       `translate(${ox}px, ${oy}px)`,
        display:         "flex",
        alignItems:      "center",
        gap:             10,
        backgroundColor: theme.colors.surface,
        border:          `1px solid ${theme.colors.dim}`,
        borderRadius:    10,
        padding:         "10px 18px",
        boxShadow:       "0 12px 40px rgba(0,0,0,0.4)",
        whiteSpace:      "nowrap",
      }}
    >
      <span style={{ fontSize: 18 }}>{callout.icon}</span>
      <span
        style={{
          fontFamily: sansFont,
          fontSize:   15,
          fontWeight: 600,
          color:      theme.colors.ink,
        }}
      >
        {callout.label}
      </span>
    </div>
  );
}

export const S3Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tx = useSceneTransition(T.S3_DUR);

  // Browser chrome springs in
  const browserSp = spring({ frame, fps, config: theme.spring });
  const browserO  = interpolate(browserSp, [0, 1], [0, 1]);
  const browserS  = interpolate(browserSp, [0, 1], [0.9, 1]);

  // Slow parallax scroll of the screenshot inside browser
  const scrollY = interpolate(frame, [0, T.S3_DUR], [0, -180], { extrapolateRight: "clamp" });

  // Resume icon drops and bounces at end of scene
  const resumeEnter = 175;
  const iconSp = spring({
    frame: Math.max(0, frame - resumeEnter),
    fps,
    config: { damping: 12, stiffness: 200, mass: 0.7 }, // CHOICE: bouncier spring for the "thud"
  });
  const iconY = interpolate(iconSp, [0, 1], [-60, 0]);
  const iconO = interpolate(iconSp, [0, 1], [0, 1]);

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
      {/* Headline above browser */}
      <Caption
        size={15}
        weight={600}
        color={theme.colors.mute}
        align="center"
        tracking="caps"
        uppercase
        style={{ marginBottom: 28 }}
      >
        Every job posting is a different puzzle
      </Caption>

      {/* Browser chrome + screenshot */}
      <div
        style={{
          position: "relative",
          opacity:  browserO,
          transform: `scale(${browserS})`,
        }}
      >
        <BrowserChrome
          url="linkedin.com/jobs/senior-product-designer-stripe-3982741"
          width={840}
          height={480}
        >
          <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
            <div
              style={{
                position:  "absolute",
                top:       0,
                left:      0,
                width:     "100%",
                transform: `translateY(${scrollY}px)`,
              }}
            >
              <Img
                src={staticFile(JOB_SCREENSHOT)}
                style={{ width: "100%", display: "block" }}
              />
            </div>
          </div>
        </BrowserChrome>

        {/* Floating callouts */}
        {CALLOUTS.map((c) => (
          <CalloutBubble key={c.label} callout={c} />
        ))}
      </div>

      {/* Resume icon drop-and-bounce */}
      <div
        style={{
          marginTop:  36,
          opacity:    frame >= resumeEnter ? iconO : 0,
          transform:  `translateY(${frame >= resumeEnter ? iconY : 0}px)`,
          display:    "flex",
          alignItems: "center",
          gap:        12,
          backgroundColor: theme.colors.surface,
          border:          `1px solid ${theme.colors.dim}`,
          padding:         "10px 20px",
          borderRadius:    8,
        }}
      >
        <span style={{ fontSize: 22 }}>📄</span>
        <Caption size={14} color={theme.colors.mute}>
          One generic resume won't cut it.
        </Caption>
      </div>
    </AbsoluteFill>
  );
};
