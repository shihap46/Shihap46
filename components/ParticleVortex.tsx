"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const PARTICLE_COUNT = 3000;

function VortexParticles() {
  const meshRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);

  const { positions, colors, sizes, initialData } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const initialData: { angle: number; radius: number; speed: number; yOffset: number; ySpeed: number }[] = [];

    const color = new THREE.Color();

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.5 + Math.random() * 4.5;
      const speed = 0.2 + Math.random() * 0.8;
      const yOffset = (Math.random() - 0.5) * 8;
      const ySpeed = 0.1 + Math.random() * 0.3;

      initialData.push({ angle, radius, speed, yOffset, ySpeed });

      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = yOffset;
      positions[i * 3 + 2] = Math.sin(angle) * radius;

      // Color gradient from acid green to white
      const t = Math.random();
      color.setHSL(0.7 - t * 0.12, 0.85 - t * 0.3, 0.55 + t * 0.35);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = 1.5 + Math.random() * 3;
    }

    return { positions, colors, sizes, initialData };
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    timeRef.current += delta;

    const posArray = meshRef.current.geometry.attributes.position.array as Float32Array;
    const sizeArray = meshRef.current.geometry.attributes.size.array as Float32Array;
    const time = timeRef.current;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const data = initialData[i];
      const currentAngle = data.angle + time * data.speed;
      // Spiral inward slightly over time, then reset
      const radiusMod = data.radius * (0.8 + 0.2 * Math.sin(time * 0.3 + i));

      posArray[i * 3] = Math.cos(currentAngle) * radiusMod;
      posArray[i * 3 + 1] = data.yOffset + Math.sin(time * data.ySpeed + i * 0.1) * 1.5;
      posArray[i * 3 + 2] = Math.sin(currentAngle) * radiusMod;

      sizeArray[i] = (1.5 + Math.random() * 2) * (0.5 + 0.5 * Math.sin(time * 2 + i));
    }

    meshRef.current.geometry.attributes.position.needsUpdate = true;
    meshRef.current.geometry.attributes.size.needsUpdate = true;
    meshRef.current.rotation.y += delta * 0.05;
  });

  const vertexShader = `
    attribute float size;
    attribute vec3 color;
    varying vec3 vColor;
    void main() {
      vColor = color;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size * (200.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const fragmentShader = `
    varying vec3 vColor;
    void main() {
      float dist = length(gl_PointCoord - vec2(0.5));
      if (dist > 0.5) discard;
      float alpha = smoothstep(0.5, 0.0, dist) * 0.6;
      gl_FragColor = vec4(vColor, alpha);
    }
  `;

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default function ParticleVortex() {
  return (
    <div className="canvas-wrap" style={{ opacity: 0.6 }}>
      <Canvas
        camera={{ position: [0, 3, 8], fov: 55 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <VortexParticles />
      </Canvas>
    </div>
  );
}
