"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Sparkles } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";
import { useInView } from "../utils/useInView";

// One orbiting satellite per discipline: ML, Deep Learning, AI + Web, Graphic Design
const SATELLITES = [
  { shape: "torusKnot", color: "#a78bfa", radius: 3.1, speed: 0.32, phase: 0, tilt: 0.25 },
  { shape: "octahedron", color: "#38bdf8", radius: 3.4, speed: 0.26, phase: Math.PI / 2, tilt: -0.35 },
  { shape: "torus", color: "#fbbf24", radius: 3.0, speed: 0.36, phase: Math.PI, tilt: 0.45 },
  { shape: "dodecahedron", color: "#ff5c8a", radius: 3.3, speed: 0.29, phase: (3 * Math.PI) / 2, tilt: -0.15 },
] as const;

type SatelliteDef = (typeof SATELLITES)[number];

function SatelliteGeometry({ shape }: { shape: SatelliteDef["shape"] }) {
  switch (shape) {
    case "torusKnot":
      return <torusKnotGeometry args={[0.36, 0.12, 96, 12]} />;
    case "octahedron":
      return <octahedronGeometry args={[0.52, 0]} />;
    case "torus":
      return <torusGeometry args={[0.42, 0.15, 16, 40]} />;
    case "dodecahedron":
      return <dodecahedronGeometry args={[0.5, 0]} />;
  }
}

function Satellite({ def }: { def: SatelliteDef }) {
  const ref = useRef<THREE.Group>(null);

  useFrame(({ clock }, delta) => {
    if (!ref.current) return;
    const a = def.phase + clock.elapsedTime * def.speed;
    ref.current.position.set(Math.cos(a) * def.radius, Math.sin(a * 1.3) * def.tilt * 2, Math.sin(a) * def.radius);
    ref.current.rotation.x += delta * 0.6;
    ref.current.rotation.y += delta * 0.9;
  });

  return (
    <group ref={ref}>
      <mesh>
        <SatelliteGeometry shape={def.shape} />
        <meshStandardMaterial color={def.color} emissive={def.color} emissiveIntensity={0.35} metalness={0.4} roughness={0.35} flatShading />
      </mesh>
      <mesh scale={1.35}>
        <SatelliteGeometry shape={def.shape} />
        <meshBasicMaterial color={def.color} wireframe transparent opacity={0.18} />
      </mesh>
    </group>
  );
}

function Core() {
  const solid = useRef<THREE.Mesh>(null);
  const shell = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (solid.current) {
      solid.current.rotation.x += delta * 0.18;
      solid.current.rotation.y += delta * 0.24;
    }
    if (shell.current) {
      shell.current.rotation.x -= delta * 0.1;
      shell.current.rotation.y -= delta * 0.14;
    }
  });

  return (
    <Float speed={1.4} rotationIntensity={0.4} floatIntensity={0.6}>
      <mesh ref={solid}>
        <icosahedronGeometry args={[1.25, 0]} />
        <meshStandardMaterial color="#111111" metalness={0.85} roughness={0.22} flatShading />
      </mesh>
      <mesh ref={shell} scale={1.55}>
        <icosahedronGeometry args={[1.25, 1]} />
        <meshBasicMaterial color="#a78bfa" wireframe transparent opacity={0.22} />
      </mesh>
    </Float>
  );
}

// Tilts the whole system gently toward the pointer for a parallax feel. On wide screens the
// system sits right of centre so it clears the headline without clipping at a canvas edge.
function Rig({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  const { width, height } = useThree((s) => s.viewport);
  const wide = width / height > 1.2;

  useFrame(({ pointer }) => {
    if (!ref.current) return;
    ref.current.rotation.y += (pointer.x * 0.45 - ref.current.rotation.y) * 0.04;
    ref.current.rotation.x += (-pointer.y * 0.3 + 0.18 - ref.current.rotation.x) * 0.04;
  });

  return (
    <group position={[wide ? width * 0.25 : 0, 0, 0]} scale={wide ? 1 : 0.8}>
      <group ref={ref}>{children}</group>
    </group>
  );
}

export default function WorkScene() {
  const [wrap, inView] = useInView<HTMLDivElement>();

  return (
    <div ref={wrap} className="canvas-wrap">
      <Canvas
        camera={{ position: [0, 0.6, 9], fov: 45 }}
        dpr={[1, 1.5]}
        frameloop={inView ? "always" : "never"}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.35} />
        <pointLight position={[5, 4, 5]} intensity={60} color="#a78bfa" />
        <pointLight position={[-6, -2, 4]} intensity={45} color="#38bdf8" />
        <pointLight position={[0, -5, -4]} intensity={40} color="#ff5c8a" />
        <Rig>
          <Core />
          {SATELLITES.map((def) => (
            <Satellite key={def.shape} def={def} />
          ))}
          <Sparkles count={70} scale={[9, 6, 9]} size={2.2} speed={0.35} color="#a78bfa" opacity={0.6} />
        </Rig>
      </Canvas>
    </div>
  );
}
