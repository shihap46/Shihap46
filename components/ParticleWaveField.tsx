"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const SEPARATION = 28;
const AMOUNTX = 80;
const AMOUNTY = 80;

function WaveParticles() {
  const meshRef = useRef<THREE.Points>(null);
  const countRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const { viewport } = useThree();

  const { positions, scales } = useMemo(() => {
    const numParticles = AMOUNTX * AMOUNTY;
    const positions = new Float32Array(numParticles * 3);
    const scales = new Float32Array(numParticles);

    let i = 0;
    let j = 0;

    for (let ix = 0; ix < AMOUNTX; ix++) {
      for (let iy = 0; iy < AMOUNTY; iy++) {
        positions[i] = ix * SEPARATION - (AMOUNTX * SEPARATION) / 2;
        positions[i + 1] = 0;
        positions[i + 2] = iy * SEPARATION - (AMOUNTY * SEPARATION) / 2;
        scales[j] = 1;
        i += 3;
        j++;
      }
    }

    return { positions, scales };
  }, []);

  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color("#a78bfa") },
    }),
    []
  );

  useFrame(({ pointer }) => {
    if (!meshRef.current) return;

    mouseRef.current.x += (pointer.x * viewport.width * 0.5 - mouseRef.current.x) * 0.05;
    mouseRef.current.y += (-pointer.y * viewport.height * 0.5 - mouseRef.current.y) * 0.05;

    const posArray = meshRef.current.geometry.attributes.position.array as Float32Array;
    const scaleArray = meshRef.current.geometry.attributes.scale.array as Float32Array;

    let i = 0;
    let j = 0;
    const count = countRef.current;

    for (let ix = 0; ix < AMOUNTX; ix++) {
      for (let iy = 0; iy < AMOUNTY; iy++) {
        posArray[i + 1] =
          Math.sin((ix + count) * 0.3) * 30 +
          Math.sin((iy + count) * 0.5) * 30;

        scaleArray[j] =
          (Math.sin((ix + count) * 0.3) + 1) * 10 +
          (Math.sin((iy + count) * 0.5) + 1) * 10;

        i += 3;
        j++;
      }
    }

    meshRef.current.geometry.attributes.position.needsUpdate = true;
    meshRef.current.geometry.attributes.scale.needsUpdate = true;

    countRef.current += 0.06;
  });

  const vertexShader = `
    attribute float scale;
    varying float vScale;
    void main() {
      vScale = scale;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = scale * (200.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const fragmentShader = `
    uniform vec3 uColor;
    varying float vScale;
    void main() {
      float dist = length(gl_PointCoord - vec2(0.5));
      if (dist > 0.5) discard;
      float alpha = smoothstep(0.5, 0.1, dist) * 0.7;
      gl_FragColor = vec4(uColor, alpha);
    }
  `;

  return (
    <points ref={meshRef} rotation={[-Math.PI / 4, 0, Math.PI / 6]}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-scale"
          args={[scales, 1]}
        />
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

function CameraController() {
  const { camera, pointer, viewport } = useThree();

  useFrame(() => {
    camera.position.x += (pointer.x * viewport.width * 0.15 - camera.position.x) * 0.02;
    camera.position.y += (-pointer.y * viewport.height * 0.15 + 600 - camera.position.y) * 0.02;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

export default function ParticleWaveField() {
  return (
    <div className="canvas-wrap" style={{ opacity: 0.7 }}>
      <Canvas
        camera={{ position: [0, 600, 800], fov: 65, near: 1, far: 10000 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <CameraController />
        <WaveParticles />
      </Canvas>
    </div>
  );
}
