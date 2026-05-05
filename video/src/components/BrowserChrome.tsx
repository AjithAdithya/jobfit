import { sansFont } from "../fonts";
import { theme } from "../theme";

interface Props {
  url?:      string;
  width?:    number;
  height?:   number;
  children?: React.ReactNode;
  style?:    React.CSSProperties;
}

const CHROME_H = 44;

// Mock browser frame: three dot buttons + URL bar.
// children renders inside the content area (scrollable via parent transforms).
// CHOICE: Rounded 12px corners, dark chrome bar — matches macOS Safari aesthetic
// more than Chrome flat UI, but reads unambiguously as "browser" in a video.
export const BrowserChrome: React.FC<Props> = ({
  url = "linkedin.com/jobs/…", width = 860, height = 540, children, style,
}) => (
  <div
    style={{
      width,
      height,
      borderRadius: 12,
      overflow:     "hidden",
      boxShadow:    "0 40px 120px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)",
      border:       "1px solid rgba(255,255,255,0.08)",
      display:      "flex",
      flexDirection: "column",
      ...style,
    }}
  >
    {/* Chrome bar */}
    <div
      style={{
        height:          CHROME_H,
        flexShrink:      0,
        backgroundColor: "#1C1C1E",
        display:         "flex",
        alignItems:      "center",
        padding:         "0 16px",
        gap:             14,
        borderBottom:    "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Traffic lights */}
      {(["#FF5F57", "#FFBD2E", "#28C840"] as const).map((c) => (
        <div key={c} style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: c }} />
      ))}

      {/* URL bar */}
      <div
        style={{
          flex:            1,
          margin:          "0 24px",
          height:          26,
          borderRadius:    6,
          backgroundColor: "rgba(255,255,255,0.07)",
          display:         "flex",
          alignItems:      "center",
          justifyContent:  "center",
          border:          "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <span
          style={{
            fontFamily:    sansFont,
            fontSize:      12,
            color:         theme.colors.mute,
            letterSpacing: "0.01em",
          }}
        >
          {url}
        </span>
      </div>
    </div>

    {/* Content area */}
    <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
      {children}
    </div>
  </div>
);
