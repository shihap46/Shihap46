"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { Billboard, OrbitControls, Text } from "@react-three/drei";
import { Suspense, useRef, useMemo } from "react";
import * as THREE from "three";
import { constellationSkills as SKILLS } from "../data/site";

function ConstellationNodes() {
  const groupRef = useRef<THREE.Group>(null);
  const linesRef = useRef<THREE.LineSegments>(null);

  // Generate node positions on a sphere
  const nodePositions = useMemo(() => {
    const positions: THREE.Vector3[] = [];
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < SKILLS.length; i++) {
      const y = 1 - (i / (SKILLS.length - 1)) * 2;
      const radius = Math.sqrt(1 - y * y);
      const theta = goldenAngle * i;
      const r = 3.4;

      positions.push(
        new THREE.Vector3(
          Math.cos(theta) * radius * r,
          y * r,
          Math.sin(theta) * radius * r
        )
      );
    }

    return positions;
  }, []);

  // Generate connection lines between nearby nodes
  const lineGeometry = useMemo(() => {
    const vertices: number[] = [];
    // Tighter than before: more nodes on the sphere would otherwise turn into a hairball
    const threshold = 3.6;

    for (let i = 0; i < nodePositions.length; i++) {
      for (let j = i + 1; j < nodePositions.length; j++) {
        const dist = nodePositions[i].distanceTo(nodePositions[j]);
        if (dist < threshold) {
          vertices.push(
            nodePositions[i].x, nodePositions[i].y, nodePositions[i].z,
            nodePositions[j].x, nodePositions[j].y, nodePositions[j].z
          );
        }
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3)
    );
    return geometry;
  }, [nodePositions]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Connection lines */}
      <lineSegments ref={linesRef} geometry={lineGeometry}>
        <lineBasicMaterial
          color="#a78bfa"
          transparent
          opacity={0.15}
        />
      </lineSegments>

      {/* Skill nodes */}
      {nodePositions.map((pos, i) => (
        <group key={SKILLS[i].label} position={pos}>
          {/* Glowing sphere */}
          <mesh>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshBasicMaterial color={SKILLS[i].color} />
          </mesh>
          {/* Outer glow */}
          <mesh>
            <sphereGeometry args={[0.25, 16, 16]} />
            <meshBasicMaterial
              color={SKILLS[i].color}
              transparent
              opacity={0.1}
            />
          </mesh>
          {/* Label — its own Suspense so font loading never suspends the whole Canvas
              (that path unmounts the R3F root and force-loses the WebGL context) */}
          <Suspense fallback={null}>
            <Billboard position={[0, 0.4, 0]}>
              <Text
                fontSize={0.2}
                color="#f2f2f0"
                anchorX="center"
                anchorY="bottom"
              >
                {SKILLS[i].label}
              </Text>
            </Billboard>
          </Suspense>
        </group>
      ))}
    </group>
  );
}

export default function SkillConstellation() {
  return (
    <div className="canvas-wrap" style={{ minHeight: "400px" }}>
      <Canvas
        camera={{ position: [0, 0, 9.5], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.5} />
        <ConstellationNodes />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.5}
          maxPolarAngle={Math.PI * 0.75}
          minPolarAngle={Math.PI * 0.25}
        />
      </Canvas>
    </div>
  );
}
