"use client";

import { useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { GalaxyDisc, Starfield } from "./three/CosmicScene";
import { useInView } from "../utils/useInView";

/* Hero background — the galaxy the intro flew into, now calm and scroll-reactive. */

function Rig({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  const { camera, viewport } = useThree();
  const wide = viewport.width / viewport.height > 1.2;

  useFrame(({ pointer }) => {
    if (!ref.current) return;
    // Drift with the pointer, and pull the camera in slightly as the hero scrolls away
    const scrolled = Math.min(1, window.scrollY / Math.max(1, window.innerHeight));
    ref.current.rotation.y += (pointer.x * 0.3 - ref.current.rotation.y) * 0.03;
    ref.current.rotation.x += (-pointer.y * 0.18 - 0.42 - ref.current.rotation.x) * 0.03;
    camera.position.z += (13 - scrolled * 5 - camera.position.z) * 0.05;
    camera.position.y += (0.6 + scrolled * 2.4 - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);
  });

  return (
    <group position={[wide ? viewport.width * 0.16 : 0, 0, 0]} scale={wide ? 1 : 0.72}>
      <group ref={ref}>{children}</group>
    </group>
  );
}

export default function HeroScene() {
  const starSpeed = useRef(1.2);
  const [wrap, inView] = useInView<HTMLDivElement>();

  return (
    <div ref={wrap} className="canvas-wrap canvas-fade">
      <Canvas
        camera={{ position: [0, 0.6, 13], fov: 58, near: 0.1, far: 300 }}
        dpr={[1, 1.5]}
        frameloop={inView ? "always" : "never"}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <Starfield count={1200} depth={120} speedRef={starSpeed} />
        <Rig>
          <GalaxyDisc count={6500} radius={7.4} rotationSpeed={0.055} intensity={0.26} inner="#ffffff" mid="#bdbdc8" outer="#7c6cf0" />
        </Rig>
      </Canvas>
    </div>
  );
}
