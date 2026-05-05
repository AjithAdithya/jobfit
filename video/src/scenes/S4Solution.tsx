import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { T } from "../timings";
import { BrowserChrome } from "../components/BrowserChrome";
import { Cursor } from "../components/Cursor";
import { Headline } from "../components/Headline";
import { Caption } from "../components/Caption";
import { useSceneTransition } from "../utils";

// CHOICE: Panel slides in over ~30 frames with a spring (confident, not floaty).
// The browser stays full-width; the panel overlays at 38% width — mirrors real sidebar UX.

export const S4Solution: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tx = useSceneTransition(T.S4_DUR);

  const CLICK_FRAME  = 65;
  const PANEL_STARTS = 74;
  const HEADLINE_AT  = 105;

  // Panel slides in from right
  const panelSp  = spring({ frame: Math.max(0, frame - PANEL_STARTS), fps, config: theme.spring });
  const panelX   = interpolate(panelSp, [0, 1], [360, 0]);
  const panelO   = interpolate(panelSp, [0, 1], [0, 1]);

  // Drop shadow on panel grows with spring
  const shadowSpread = interpolate(panelSp, [0, 1], [0, 60]);

  const W_BROWSER = 840;
  const W_PANEL   = 320;

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
      {/* "One click." headline */}
      {frame >= HEADLINE_AT && (
        <div style={{ marginBottom: 24 }}>
          <Headline
            size={72}
            startFrame={0}
            charDelay={2}
            align="center"
          >
            One click.
          </Headline>
        </div>
      )}

      {/* Browser + panel row */}
      <div style={{ position: "relative", display: "flex" }}>

        {/* Browser */}
        <BrowserChrome
          url="linkedin.com/jobs/senior-product-designer-stripe-3982741"
          width={W_BROWSER}
          height={460}
        >
          <Img
            src={staticFile("screenshots/ext-01-home.png")}
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
          />
        </BrowserChrome>

        {/* Extension side panel slides in */}
        <div
          style={{
            position:   "absolute",
            right:      -W_PANEL * 0.08,
            top:        0,
            width:      W_PANEL,
            height:     460,
            transform:  `translateX(${panelX}px)`,
            opacity:    panelO,
            borderRadius:  10,
            overflow:      "hidden",
            boxShadow:     `${shadowSpread * -1}px 0 ${shadowSpread}px rgba(0,0,0,0.5), -2px 0 0 rgba(255,255,255,0.06)`,
          }}
        >
          <Img
            src={staticFile("screenshots/ext-01-home.png")}
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
          />
          {/* Overlay to show it's the extension UI */}
          <div
            style={{
              position:        "absolute",
              top:             8,
              left:            8,
              backgroundColor: theme.colors.accent,
              borderRadius:    4,
              padding:         "3px 8px",
              fontSize:        10,
              fontWeight:      700,
              color:           theme.colors.ink,
              letterSpacing:   "0.1em",
              textTransform:   "uppercase",
            }}
          >
            JobFit AI
          </div>
        </div>

        {/* SVG cursor overlay */}
        <svg
          style={{ position: "absolute", top: 0, left: 0, width: W_BROWSER, height: 460, overflow: "visible", pointerEvents: "none" }}
          viewBox={`0 0 ${W_BROWSER} 460`}
        >
          <Cursor
            waypoints={[
              { x: 400, y: 280, frame: 0  },   // resting in page body
              { x: 760, y: 36,  frame: 48 },   // moves to toolbar extension icon area
              { x: 760, y: 36,  frame: 80 },   // stays there
            ]}
            clickFrame={CLICK_FRAME}
          />
        </svg>
      </div>

      {/* Sub-caption */}
      <Caption
        size={15}
        color={theme.colors.mute}
        align="center"
        style={{ marginTop: 24, opacity: frame >= HEADLINE_AT ? 1 : 0 }}
      >
        Navigate to any job page · Click the extension · Done.
      </Caption>
    </AbsoluteFill>
  );
};
