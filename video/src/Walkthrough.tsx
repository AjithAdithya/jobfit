import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
  staticFile,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

// Load Inter font (all weights needed)
const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "700", "900"],
  subsets: ["latin"],
});

// ── Video constants ─────────────────────────────────────────────
export const FPS = 30;
export const VIDEO_WIDTH = 1280;
export const VIDEO_HEIGHT = 720;

const INTRO_DUR = 70;   // ~2.3s
const SCREEN_DUR = 95;  // ~3.2s per screen
const OUTRO_DUR = 80;   // ~2.7s

// ── Design tokens ───────────────────────────────────────────────
const T = {
  cream:   "#EDE9E3",
  ink900:  "#0A0B0E",
  ink800:  "#14161B",
  ink700:  "#24272D",
  ink600:  "#3A3E46",
  ink500:  "#555A63",
  ink400:  "#7B8088",
  ink300:  "#A9AEB6",
  ink200:  "#D3D6DB",
  crimson: "#C01414",
  cr600:   "#9C0A0A",
  cr50:    "#FDECEC",
  citrus:  "#D7FF3A",
  flare:   "#FF4D2E",
  sky:     "#5DD4FF",
};

// ── Screen manifest ─────────────────────────────────────────────
const SCREENS = [
  {
    img: "ext-01-home.png",
    tag: "Home",
    title: "Analyze any job\nin one click.",
    desc: "Navigate to any job board — LinkedIn, Indeed, Greenhouse — and hit Analyze. JobFit extracts the full job description automatically.",
    accent: T.crimson,
  },
  {
    img: "ext-03-match-score.png",
    tag: "Analysis",
    title: "Your match score,\ninstantly.",
    desc: "A semantic AI score out of 100. See exactly which strengths land and which gaps to close — before you apply.",
    accent: T.sky,
  },
  {
    img: "ext-04-match-resume.png",
    tag: "Resume AI",
    title: "Tailored resume,\ngenerated.",
    desc: "One click generates an ATS-optimized, LaTeX-crafted resume that speaks directly to the role's requirements.",
    accent: T.crimson,
  },
  {
    img: "ext-05-resume-preview.png",
    tag: "Export",
    title: "Preview and\ndownload.",
    desc: "Live LaTeX preview in the sidebar. Export to PDF, .tex, or send straight to Google Drive without leaving the page.",
    accent: T.citrus,
  },
  {
    img: "ext-07-cl-intel.png",
    tag: "Research",
    title: "Company intel,\nauto-researched.",
    desc: "JobFit looks up the company's stage, team size, tech stack and recent news — so your letter sounds like you did your homework.",
    accent: T.sky,
  },
  {
    img: "ext-08-cl-tone.png",
    tag: "Cover Letter",
    title: "Pick your\ntone.",
    desc: "Professional, Warm, Direct, or Enthusiastic — choose how you want to come across, then let AI do the writing.",
    accent: T.flare,
  },
  {
    img: "ext-09-cl-letter.png",
    tag: "Done",
    title: "Cover letter,\nwritten.",
    desc: "Personalized in seconds. Copy it, download as DOCX, or open directly in Google Drive — ready to send.",
    accent: T.citrus,
  },
];

export const TOTAL_FRAMES =
  INTRO_DUR + SCREENS.length * SCREEN_DUR + OUTRO_DUR;

// ── Device mock dimensions (portrait sidebar) ────────────────────
// Screenshots are ~556×1204 — we show them at a comfortable height
const DEVICE_H = 596;
const DEVICE_W = Math.round(DEVICE_H * (556 / 1204)); // ≈ 257px
const DEVICE_RADIUS = 14;

// ── Shared font style ────────────────────────────────────────────
const FF = { fontFamily };

// ════════════════════════════════════════════════════════════════
// INTRO
// ════════════════════════════════════════════════════════════════
const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 22], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [INTRO_DUR - 18, INTRO_DUR], [1, 0], { extrapolateLeft: "clamp" });
  const opacity = Math.min(fadeIn, fadeOut);

  const logoSpring = spring({ frame, fps, config: { damping: 14, stiffness: 90 }, durationInFrames: 35 });
  const logoScale = interpolate(logoSpring, [0, 1], [0.72, 1]);
  const logoY = interpolate(logoSpring, [0, 1], [24, 0]);

  const subOpacity = interpolate(frame, [28, 46], [0, 1], { extrapolateRight: "clamp" });
  const subY = interpolate(frame, [28, 46], [10, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: T.ink900,
        opacity,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Top crimson bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, backgroundColor: T.crimson }} />

      {/* Logo */}
      <div
        style={{
          ...FF,
          fontSize: 88,
          fontWeight: 900,
          lineHeight: 1,
          letterSpacing: "-0.04em",
          transform: `scale(${logoScale}) translateY(${logoY}px)`,
        }}
      >
        <span style={{ color: T.cream }}>Job</span>
        <span style={{ color: T.crimson }}>fit</span>
      </div>

      {/* Tagline */}
      <div
        style={{
          ...FF,
          marginTop: 20,
          fontSize: 16,
          fontWeight: 500,
          color: T.ink400,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          opacity: subOpacity,
          transform: `translateY(${subY}px)`,
        }}
      >
        AI-Powered Job Hunting
      </div>

      {/* Citrus pill */}
      <div
        style={{
          marginTop: 28,
          backgroundColor: T.citrus,
          color: T.ink900,
          padding: "8px 20px",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          ...FF,
          opacity: subOpacity,
          transform: `translateY(${subY}px)`,
        }}
      >
        Chrome Extension · Sidebar Walkthrough
      </div>

      {/* Bottom crimson bar */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, backgroundColor: T.crimson }} />
    </AbsoluteFill>
  );
};

// ════════════════════════════════════════════════════════════════
// SCREEN SLIDE
// ════════════════════════════════════════════════════════════════
interface SlideProps {
  img: string;
  tag: string;
  title: string;
  desc: string;
  accent: string;
  index: number;
}

const ScreenSlide: React.FC<SlideProps> = ({ img, tag, title, desc, accent, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── Enter ────────────────────────────────────────────────────
  const enterSpring = spring({ frame, fps, config: { damping: 18, stiffness: 110, mass: 0.9 }, durationInFrames: 32 });
  const deviceX = interpolate(enterSpring, [0, 1], [140, 0]);
  const deviceOpacity = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: "clamp" });

  const tagOpacity = interpolate(frame, [14, 28], [0, 1], { extrapolateRight: "clamp" });
  const titleOpacity = interpolate(frame, [20, 36], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [20, 40], [14, 0], { extrapolateRight: "clamp" });
  const descOpacity = interpolate(frame, [30, 48], [0, 1], { extrapolateRight: "clamp" });

  // ── Exit ─────────────────────────────────────────────────────
  const exitStart = SCREEN_DUR - 18;
  const exitOpacity = interpolate(frame, [exitStart, SCREEN_DUR], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exitShift = interpolate(frame, [exitStart, SCREEN_DUR], [0, -48], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── Float ────────────────────────────────────────────────────
  const floatY = Math.sin((frame / fps) * Math.PI * 0.7) * 5;

  // ── Progress ─────────────────────────────────────────────────
  const progress = (index + frame / SCREEN_DUR) / SCREENS.length;

  // ── Layout ───────────────────────────────────────────────────
  const LEFT_W = 620;
  const deviceRight = VIDEO_WIDTH - 100 - DEVICE_W;

  return (
    <AbsoluteFill style={{ backgroundColor: T.ink900 }}>
      {/* Top bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, backgroundColor: T.crimson }} />

      {/* ── Left panel: text ─────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: LEFT_W,
          height: VIDEO_HEIGHT,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingLeft: 88,
          paddingRight: 40,
          opacity: exitOpacity,
          transform: `translateX(${exitShift}px)`,
        }}
      >
        {/* Tag badge */}
        <div
          style={{
            ...FF,
            display: "inline-flex",
            alignSelf: "flex-start",
            backgroundColor: accent,
            color: accent === T.citrus || accent === T.sky ? T.ink900 : T.cream,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            padding: "5px 14px",
            borderRadius: 2,
            marginBottom: 22,
            opacity: tagOpacity,
          }}
        >
          {tag}
        </div>

        {/* Title */}
        <div
          style={{
            ...FF,
            fontSize: 52,
            fontWeight: 900,
            color: T.cream,
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
            whiteSpace: "pre-line",
            marginBottom: 24,
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
          }}
        >
          {title}
        </div>

        {/* Description */}
        <div
          style={{
            ...FF,
            fontSize: 16,
            fontWeight: 400,
            color: T.ink400,
            lineHeight: 1.65,
            maxWidth: 400,
            opacity: descOpacity,
          }}
        >
          {desc}
        </div>

        {/* Bottom logo watermark */}
        <div
          style={{
            position: "absolute",
            bottom: 38,
            left: 88,
            display: "flex",
            alignItems: "baseline",
            ...FF,
            fontSize: 13,
            fontWeight: 900,
            opacity: 0.3,
          }}
        >
          <span style={{ color: T.cream }}>Job</span>
          <span style={{ color: T.crimson }}>fit</span>
          <span style={{ color: T.ink500, fontWeight: 400, marginLeft: 6, fontSize: 11 }}>AI</span>
        </div>
      </div>

      {/* ── Right panel: device mock ─────────────────────────── */}
      <div
        style={{
          position: "absolute",
          left: deviceRight,
          top: "50%",
          width: DEVICE_W,
          height: DEVICE_H,
          transform: `translateX(${deviceX}px) translateY(calc(-50% + ${floatY}px))`,
          opacity: deviceOpacity,
        }}
      >
        {/* Drop shadow */}
        <div
          style={{
            position: "absolute",
            bottom: -28,
            left: "50%",
            transform: "translateX(-50%)",
            width: "75%",
            height: 28,
            background:
              "radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, transparent 72%)",
            borderRadius: "50%",
          }}
        />

        {/* Outer glow ring */}
        <div
          style={{
            position: "absolute",
            inset: -2,
            borderRadius: DEVICE_RADIUS + 2,
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: `0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)`,
          }}
        />

        {/* Accent glow behind device */}
        <div
          style={{
            position: "absolute",
            inset: -20,
            borderRadius: DEVICE_RADIUS + 20,
            background: `radial-gradient(ellipse at 50% 40%, ${accent}18 0%, transparent 70%)`,
            pointerEvents: "none",
          }}
        />

        {/* Screenshot image */}
        <Img
          src={staticFile(`screenshots/${img}`)}
          style={{
            width: DEVICE_W,
            height: DEVICE_H,
            objectFit: "cover",
            objectPosition: "top center",
            borderRadius: DEVICE_RADIUS,
            display: "block",
          }}
        />

        {/* Subtle top-edge gloss */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 60,
            borderRadius: `${DEVICE_RADIUS}px ${DEVICE_RADIUS}px 0 0`,
            background:
              "linear-gradient(to bottom, rgba(255,255,255,0.07) 0%, transparent 100%)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* ── Progress bar ─────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 3,
          backgroundColor: T.ink800,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${Math.min(progress, 1) * 100}%`,
            backgroundColor: T.crimson,
          }}
        />
      </div>

      {/* Screen counter */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          right: 36,
          ...FF,
          fontSize: 11,
          fontWeight: 500,
          color: T.ink600,
          letterSpacing: "0.05em",
        }}
      >
        {index + 1} / {SCREENS.length}
      </div>
    </AbsoluteFill>
  );
};

// ════════════════════════════════════════════════════════════════
// OUTRO
// ════════════════════════════════════════════════════════════════
const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  const logoSpring = spring({ frame, fps, config: { damping: 14, stiffness: 80 }, durationInFrames: 32 });
  const logoScale = interpolate(logoSpring, [0, 1], [0.8, 1]);

  const sub1Opacity = interpolate(frame, [22, 38], [0, 1], { extrapolateRight: "clamp" });
  const sub1Y = interpolate(frame, [22, 42], [10, 0], { extrapolateRight: "clamp" });

  const sub2Opacity = interpolate(frame, [34, 50], [0, 1], { extrapolateRight: "clamp" });
  const sub2Y = interpolate(frame, [34, 52], [10, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: T.ink900,
        opacity: fadeIn,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Crimson bars top + bottom */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, backgroundColor: T.crimson }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, backgroundColor: T.crimson }} />

      {/* Logo */}
      <div
        style={{
          ...FF,
          fontSize: 96,
          fontWeight: 900,
          lineHeight: 1,
          letterSpacing: "-0.04em",
          transform: `scale(${logoScale})`,
        }}
      >
        <span style={{ color: T.cream }}>Job</span>
        <span style={{ color: T.crimson }}>fit</span>
      </div>

      {/* Tagline */}
      <div
        style={{
          ...FF,
          marginTop: 20,
          fontSize: 18,
          fontWeight: 400,
          color: T.ink400,
          opacity: sub1Opacity,
          transform: `translateY(${sub1Y}px)`,
        }}
      >
        Tailor in seconds. Match with precision.
      </div>

      {/* CTA row */}
      <div
        style={{
          marginTop: 32,
          display: "flex",
          gap: 14,
          opacity: sub2Opacity,
          transform: `translateY(${sub2Y}px)`,
        }}
      >
        <div
          style={{
            ...FF,
            backgroundColor: T.crimson,
            color: T.cream,
            padding: "13px 28px",
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Install on Chrome
        </div>
        <div
          style={{
            ...FF,
            backgroundColor: T.citrus,
            color: T.ink900,
            padding: "13px 28px",
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          jobfit.ai
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ════════════════════════════════════════════════════════════════
// ROOT COMPOSITION
// ════════════════════════════════════════════════════════════════
export const Walkthrough: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: T.ink900 }}>
      {/* Intro */}
      <Sequence from={0} durationInFrames={INTRO_DUR}>
        <Intro />
      </Sequence>

      {/* Screens */}
      {SCREENS.map((s, i) => (
        <Sequence
          key={i}
          from={INTRO_DUR + i * SCREEN_DUR}
          durationInFrames={SCREEN_DUR}
        >
          <ScreenSlide
            img={s.img}
            tag={s.tag}
            title={s.title}
            desc={s.desc}
            accent={s.accent}
            index={i}
          />
        </Sequence>
      ))}

      {/* Outro */}
      <Sequence
        from={INTRO_DUR + SCREENS.length * SCREEN_DUR}
        durationInFrames={OUTRO_DUR}
      >
        <Outro />
      </Sequence>
    </AbsoluteFill>
  );
};
