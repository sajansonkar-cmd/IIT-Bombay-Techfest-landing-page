import { HolographicHero } from "./hero/HolographicHero.js";
import { initPageMotion } from "./pageMotion.js";
import { initCompatibilityScanner } from "./scanner.js";

const heroCanvas = document.querySelector("#hero-canvas");
const heroScene = new HolographicHero({ canvas: heroCanvas });

heroScene.start();
initPageMotion();
initCompatibilityScanner();

window.addEventListener(
  "beforeunload",
  () => {
    heroScene.destroy();
  },
  { once: true }
);
