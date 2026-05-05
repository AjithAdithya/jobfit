import { Composition } from "remotion";
import { Walkthrough, TOTAL_FRAMES, FPS, VIDEO_WIDTH, VIDEO_HEIGHT } from "./Walkthrough";
import { JobFitWalkthrough } from "./JobFitWalkthrough";
import { T, W, H } from "./timings";

export const Root: React.FC = () => {
  return (
    <>
      {/* v1 — sidebar walkthrough (1280×720) */}
      <Composition
        id="WalkthroughVideo"
        component={Walkthrough}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
      />

      {/* v2 — cinematic LinkedIn square (1080×1080, 60s) */}
      <Composition
        id="JobFitCinematic"
        component={JobFitWalkthrough}
        durationInFrames={T.TOTAL}
        fps={30}
        width={W}
        height={H}
      />
    </>
  );
};
