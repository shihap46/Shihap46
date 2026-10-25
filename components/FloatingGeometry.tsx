"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useInView } from "../utils/useInView";

type ShapeType = "icosahedron" | "torusKnot" | "octahedron" | "dodecahedron" | "torus" | "sun";

const RAYS = Array.from({ length: 12 }, (_, i) => (i / 12) * Math.PI * 2);

function Shape({
  shape = "icosahedron",
  color = "#a78bfa",
  scale = 2,
  wireframe = true,
  speed = 0.3,
}: {
  shape?: ShapeType;
  color?: string;
  scale?: number;
  wireframe?: boolean;
  speed?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    // The sun spins in its own plane so the halo always reads as a circle
    if (groupRef.current) {
      groupRef.current.rotation.z += delta * speed * 0.6;
      return;
    }
    if (!meshRef.current) return;
    meshRef.current.rotation.x += delta * speed * 0.5;
    meshRef.current.rotation.y += delta * speed;
  });

  const geometry = useMemo(() => {
    switch (shape) {
      case "torusKnot":
        return <torusKnotGeometry args={[1, 0.28, 64, 10]} />;
      case "octahedron":
        return <octahedronGeometry args={[1, 0]} />;
      case "dodecahedron":
        return <dodecahedronGeometry args={[1, 0]} />;
      case "torus":
        return <torusGeometry args={[1, 0.33, 12, 36]} />;
      case "icosahedron":
      default:
        return <icosahedronGeometry args={[1, 1]} />;
    }
  }, [shape]);

  // A sun for the solar project: faceted core, tilted halo ring and radiating rays
  if (shape === "sun") {
    return (
      <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
        <group ref={groupRef} scale={scale}>
          <mesh>
            <icosahedronGeometry args={[0.66, 1]} />
            <meshBasicMaterial color={color} wireframe={wireframe} transparent opacity={0.45} />
          </mesh>
          <mesh>
            <torusGeometry args={[1.18, 0.012, 8, 64]} />
            <meshBasicMaterial color={color} transparent opacity={0.5} />
          </mesh>
          {RAYS.map((angle, i) => (
            <mesh key={i} rotation={[0, 0, angle]} position={[Math.cos(angle) * 0.95, Math.sin(angle) * 0.95, 0]}>
              <boxGeometry args={[0.3, 0.012, 0.012]} />
              <meshBasicMaterial color={color} transparent opacity={i % 2 ? 0.28 : 0.5} />
            </mesh>
          ))}
        </group>
      </Float>
    );
  }

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
      <mesh ref={meshRef} scale={scale}>
        {geometry}
        <meshBasicMaterial
          color={color}
          wireframe={wireframe}
          transparent
          opacity={0.4}
        />
      </mesh>
    </Float>
  );
}

export default function FloatingGeometry({
  shape = "icosahedron",
  color = "#a78bfa",
  scale = 2,
  wireframe = true,
  speed = 0.3,
  className = "",
  style = {},
}: {
  shape?: ShapeType;
  color?: string;
  scale?: number;
  wireframe?: boolean;
  speed?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [wrap, inView] = useInView<HTMLDivElement>();

  return (
    <div ref={wrap} className={`canvas-wrap ${className}`} style={style}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        dpr={[1, 1.5]}
        frameloop={inView ? "always" : "never"}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.3} />
        <Shape shape={shape} color={color} scale={scale} wireframe={wireframe} speed={speed} />
      </Canvas>
    </div>
  );
}
