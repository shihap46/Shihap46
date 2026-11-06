import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: [
      "components/CyberRoverGame.tsx",
      "components/HeroScene.tsx",
      "components/IntroSequence.tsx",
      "components/ParticleVortex.tsx",
      "components/ParticleWaveField.tsx",
      "components/Scene.tsx",
      "components/Hero3DName.tsx",
      "components/scenes/SolarRoofScene.tsx",
      "components/three/CosmicScene.tsx",
    ],
    // React Three Fiber mutates scene objects in render-loop callbacks and seeds GPU buffers in memoized setup.
    rules: {
      "react-hooks/immutability": "off",
      "react-hooks/purity": "off",
      "react-hooks/refs": "off",
      "react-hooks/use-memo": "off",
    },
  },
  {
    files: [
      "components/IntroGate.tsx",
      "components/scenes/BloodNetworkScene.tsx",
      "components/scenes/SolarRoofScene.tsx",
      "components/site/useIstClock.ts",
      "utils/intro.ts",
    ],
    rules: { "react-hooks/set-state-in-effect": "off" },
  },
  globalIgnores([".next/**", "out/**", "build/**", "node_modules/**", "next-env.d.ts"]),
]);
