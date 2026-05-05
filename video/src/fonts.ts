// Called at module level — @remotion/google-fonts handles delayRender/continueRender internally.
// fontFamily strings returned here are the CSS font-family names to drop into style props.

import { loadFont as loadFraunces }   from "@remotion/google-fonts/Fraunces";
import { loadFont as loadInter }      from "@remotion/google-fonts/Inter";
import { loadFont as loadJetBrains }  from "@remotion/google-fonts/JetBrainsMono";

export const displayFont = loadFraunces("normal", {
  weights: ["400", "700", "900"],
  subsets: ["latin"],
}).fontFamily;

export const sansFont = loadInter("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
}).fontFamily;

export const monoFont = loadJetBrains("normal", {
  weights: ["400", "700"],
  subsets: ["latin"],
}).fontFamily;
