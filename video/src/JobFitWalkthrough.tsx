import { AbsoluteFill, Sequence } from "remotion";
import { T } from "./timings";
import { GrainOverlay } from "./components/GrainOverlay";
import { ProgressBar } from "./components/ProgressBar";
import { S1Hook } from "./scenes/S1Hook";
import { S2LogoReveal } from "./scenes/S2LogoReveal";
import { S3Problem } from "./scenes/S3Problem";
import { S4Solution } from "./scenes/S4Solution";
import { S5Magic } from "./scenes/S5Magic";
import { S6Result } from "./scenes/S6Result";
import { S7Credibility } from "./scenes/S7Credibility";
import { S8CTA } from "./scenes/S8CTA";

export const JobFitWalkthrough: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0A0B0E" }}>

      {/* ── Scenes ──────────────────────────────────────────────── */}
      <Sequence from={T.S1_START} durationInFrames={T.S1_DUR}>
        <S1Hook />
      </Sequence>

      <Sequence from={T.S2_START} durationInFrames={T.S2_DUR}>
        <S2LogoReveal />
      </Sequence>

      <Sequence from={T.S3_START} durationInFrames={T.S3_DUR}>
        <S3Problem />
      </Sequence>

      <Sequence from={T.S4_START} durationInFrames={T.S4_DUR}>
        <S4Solution />
      </Sequence>

      <Sequence from={T.S5_START} durationInFrames={T.S5_DUR}>
        <S5Magic />
      </Sequence>

      <Sequence from={T.S6_START} durationInFrames={T.S6_DUR}>
        <S6Result />
      </Sequence>

      <Sequence from={T.S7_START} durationInFrames={T.S7_DUR}>
        <S7Credibility />
      </Sequence>

      <Sequence from={T.S8_START} durationInFrames={T.S8_DUR}>
        <S8CTA />
      </Sequence>

      {/* ── Global overlays (render on top of every scene) ──────── */}
      <ProgressBar totalFrames={T.TOTAL} />
      <GrainOverlay />
    </AbsoluteFill>
  );
};
