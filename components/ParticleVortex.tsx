"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const PARTICLE_COUNT = 3000;

const vertexShader = `
  attribute float aAngle;
  attribute float aRadius;
  attribute float aSpeed;
  attribute float aYOffset;
  attribute float aYSpeed;
  attribute float aBaseSize;
  attribute vec3 color;

  uniform float uTime;
  varying vec3 vColor;

  void main() {
    vColor = color;

    float currentAngle = aAngle + uTime * aSpeed;
    float radiusMod = aRadius * (0.8 + 0.2 * sin(uTime * 0.3 + aAngle * 10.0));

    vec3 pos;
    pos.x = cos(currentAngle) * radiusMod;
    pos.y = aYOffset + sin(uTime * aYSpeed + aAngle * 5.0) * 1.5;
    pos.z = sin(currentAngle) * radiusMod;

    float dynamicSize = aBaseSize * (0.5 + 0.5 * sin(uTime * 2.0 + aAngle * 10.0));

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = dynamicSize * (200.0 / -mvPosition.z);
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

function VortexParticles() {
  const meshRef = useRef<THREE.Points>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
    }),
    []
  );

  const {
    positions,
    colors,
    angles,
    radii,
    speeds,
    yOffsets,
    ySpeeds,
    baseSizes,
  } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const angles = new Float32Array(PARTICLE_COUNT);
    const radii = new Float32Array(PARTICLE_COUNT);
    const speeds = new Float32Array(PARTICLE_COUNT);
    const yOffsets = new Float32Array(PARTICLE_COUNT);
    const ySpeeds = new Float32Array(PARTICLE_COUNT);
    const baseSizes = new Float32Array(PARTICLE_COUNT);

    const color = new THREE.Color();

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.5 + Math.random() * 4.5;
      const speed = 0.2 + Math.random() * 0.8;
      const yOffset = (Math.random() - 0.5) * 8;
      const ySpeed = 0.1 + Math.random() * 0.3;

      angles[i] = angle;
      radii[i] = radius;
      speeds[i] = speed;
      yOffsets[i] = yOffset;
      ySpeeds[i] = ySpeed;

      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = yOffset;
      positions[i * 3 + 2] = Math.sin(angle) * radius;

      // Color gradient from acid green to white
      const t = Math.random();
      color.setHSL(0.7 - t * 0.12, 0.85 - t * 0.3, 0.55 + t * 0.35);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      baseSizes[i] = 1.5 + Math.random() * 3;
    }

    return { positions, colors, angles, radii, speeds, yOffsets, ySpeeds, baseSizes };
  }, []);

  useFrame((_, delta) => {
    uniforms.uTime.value += delta;
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        <bufferAttribute attach="attributes-aAngle" args={[angles, 1]} />
        <bufferAttribute attach="attributes-aRadius" args={[radii, 1]} />
        <bufferAttribute attach="attributes-aSpeed" args={[speeds, 1]} />
        <bufferAttribute attach="attributes-aYOffset" args={[yOffsets, 1]} />
        <bufferAttribute attach="attributes-aYSpeed" args={[ySpeeds, 1]} />
        <bufferAttribute attach="attributes-aBaseSize" args={[baseSizes, 1]} />
      </bufferGeometry>
      <shaderMaterial
        uniforms={uniforms}
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
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        dpr={[1, 1.35]}
        style={{ background: "transparent" }}
      >
        <VortexParticles />
      </Canvas>
    </div>
  );
}
