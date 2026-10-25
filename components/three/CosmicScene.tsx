"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* Shared building blocks for the intro cinematic and the hero scene.
   Everything is points/additive geometry so it stays cheap on mobile GPUs. */

const POINT_VERT = `
  attribute float size;
  attribute vec3 color;
  varying vec3 vColor;
  uniform float uScale;
  void main() {
    vColor = color;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = min(size * (uScale / -mv.z), 26.0);
    gl_Position = projectionMatrix * mv;
  }
`;

const POINT_FRAG = `
  varying vec3 vColor;
  uniform float uOpacity;
  uniform float uIntensity;
  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vColor, a * uOpacity * uIntensity);
  }
`;

function usePointMaterial(opacity: number, scale = 260, intensity = 1) {
  return useMemo(
    () => ({
      uScale: { value: scale },
      uOpacity: { value: opacity },
      uIntensity: { value: intensity },
    }),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );
}

/* ─────────── Starfield: stars streaming toward the camera ─────────── */
export function Starfield({
  count = 2600,
  depth = 160,
  speedRef,
  opacityRef,
  color = "#ffffff",
}: {
  count?: number;
  depth?: number;
  speedRef?: React.RefObject<number>;
  opacityRef?: React.RefObject<number>;
  color?: string;
}) {
  const points = useRef<THREE.Points>(null);
  const uniforms = usePointMaterial(1, 180, 0.75);

  const { positions, colors, sizes } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const r = 6 + Math.random() * 46;
      const a = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = Math.sin(a) * r * 0.7;
      positions[i * 3 + 2] = -Math.random() * depth;
      c.set(color);
      c.offsetHSL(0, 0, (Math.random() - 0.5) * 0.25);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
      sizes[i] = 0.5 + Math.random() * 1.5;
    }
    return { positions, colors, sizes };
  }, [count, depth, color]);

  useFrame((_, delta) => {
    if (!points.current) return;
    const speed = speedRef?.current ?? 6;
    const arr = points.current.geometry.attributes.position.array as Float32Array;
    for (let i = 2; i < arr.length; i += 3) {
      arr[i] += speed * delta;
      if (arr[i] > 12) arr[i] -= depth;
    }
    points.current.geometry.attributes.position.needsUpdate = true;
    uniforms.uOpacity.value = opacityRef?.current ?? 1;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={POINT_VERT}
        fragmentShader={POINT_FRAG}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ─────────── Galaxy: spiral arms of points ─────────── */
export function GalaxyDisc({
  count = 11000,
  radius = 9,
  arms = 3,
  spin = 1.15,
  spread = 0.34,
  inner = "#fdf4ff",
  outer = "#38bdf8",
  mid = "#a78bfa",
  opacityRef,
  rotationSpeed = 0.05,
  scaleRef,
  intensity = 0.5,
}: {
  count?: number;
  radius?: number;
  arms?: number;
  spin?: number;
  spread?: number;
  inner?: string;
  outer?: string;
  mid?: string;
  opacityRef?: React.RefObject<number>;
  rotationSpeed?: number;
  scaleRef?: React.RefObject<number>;
  intensity?: number;
}) {
  const group = useRef<THREE.Group>(null);
  const uniforms = usePointMaterial(1, 150, intensity);

  const { positions, colors, sizes } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const cInner = new THREE.Color(inner);
    const cMid = new THREE.Color(mid);
    const cOuter = new THREE.Color(outer);
    const c = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const r = Math.pow(Math.random(), 0.62) * radius;
      const branch = ((i % arms) / arms) * Math.PI * 2;
      const angle = branch + r * spin;
      const jitter = () => Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * spread * (r + 0.6);

      positions[i * 3] = Math.cos(angle) * r + jitter();
      positions[i * 3 + 1] = jitter() * 0.32;
      positions[i * 3 + 2] = Math.sin(angle) * r + jitter();

      const t = r / radius;
      c.copy(cInner).lerp(cMid, Math.min(1, t * 1.8));
      if (t > 0.5) c.lerp(cOuter, (t - 0.5) * 2);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
      sizes[i] = 0.45 + Math.random() * 1.25 * (1 - t * 0.35);
    }
    return { positions, colors, sizes };
  }, [count, radius, arms, spin, spread, inner, mid, outer]);

  useFrame((_, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * rotationSpeed;
    uniforms.uOpacity.value = opacityRef?.current ?? 1;
    const s = scaleRef?.current ?? 1;
    group.current.scale.setScalar(s);
  });

  return (
    <group ref={group}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
          <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
        </bufferGeometry>
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={POINT_VERT}
          fragmentShader={POINT_FRAG}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

/* ─────────── Ring tunnel: the portal the camera flies through ─────────── */
export function RingTunnel({
  rings = 22,
  spacing = 7,
  radius = 3.4,
  opacityRef,
}: {
  rings?: number;
  spacing?: number;
  radius?: number;
  opacityRef?: React.RefObject<number>;
}) {
  const group = useRef<THREE.Group>(null);
  const mats = useRef<THREE.MeshBasicMaterial[]>([]);

  const defs = useMemo(
    () =>
      Array.from({ length: rings }, (_, i) => ({
        z: -i * spacing,
        r: radius * (1 + Math.sin(i * 0.6) * 0.12),
        rot: Math.random() * Math.PI,
        color: i % 3 === 0 ? "#a78bfa" : i % 3 === 1 ? "#f472b6" : "#38bdf8",
      })),
    [rings, spacing, radius]
  );

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.z += delta * 0.12;
    const o = opacityRef?.current ?? 1;
    for (const m of mats.current) if (m) m.opacity = o * 0.75;
  });

  return (
    <group ref={group}>
      {defs.map((d, i) => (
        <mesh key={i} position={[0, 0, d.z]} rotation={[0, 0, d.rot]}>
          <torusGeometry args={[d.r, 0.016, 8, 72]} />
          <meshBasicMaterial
            ref={(m) => {
              if (m) mats.current[i] = m;
            }}
            color={d.color}
            transparent
            opacity={0.75}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ─────────── Neural network: nodes + synapses ─────────── */
export function NeuralNetwork({
  nodes = 34,
  spread = 4.4,
  linkDistance = 2.5,
  opacityRef,
  color = "#a78bfa",
  accent = "#38bdf8",
}: {
  nodes?: number;
  spread?: number;
  linkDistance?: number;
  opacityRef?: React.RefObject<number>;
  color?: string;
  accent?: string;
}) {
  const group = useRef<THREE.Group>(null);
  const lineMat = useRef<THREE.LineBasicMaterial>(null);
  const nodeMat = useRef<THREE.MeshBasicMaterial>(null);
  const glowMat = useRef<THREE.MeshBasicMaterial>(null);

  const { points, lineGeometry } = useMemo(() => {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i < nodes; i++) {
      // Layered like a network rather than a random cloud
      const layer = Math.floor(i / Math.ceil(nodes / 4)) - 1.5;
      points.push(
        new THREE.Vector3(
          layer * spread * 0.55 + (Math.random() - 0.5) * 0.7,
          (Math.random() - 0.5) * spread,
          (Math.random() - 0.5) * spread
        )
      );
    }
    const verts: number[] = [];
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        if (points[i].distanceTo(points[j]) < linkDistance) {
          verts.push(points[i].x, points[i].y, points[i].z, points[j].x, points[j].y, points[j].z);
        }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    return { points, lineGeometry: g };
  }, [nodes, spread, linkDistance]);

  useFrame(({ clock }, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.12;
    const o = opacityRef?.current ?? 1;
    const pulse = 0.65 + Math.sin(clock.elapsedTime * 2.2) * 0.25;
    if (lineMat.current) lineMat.current.opacity = o * 0.28;
    if (nodeMat.current) nodeMat.current.opacity = o;
    if (glowMat.current) glowMat.current.opacity = o * 0.12 * pulse;
  });

  return (
    <group ref={group}>
      <lineSegments geometry={lineGeometry}>
        <lineBasicMaterial ref={lineMat} color={accent} transparent opacity={0.28} depthWrite={false} />
      </lineSegments>
      {points.map((p, i) => (
        <group key={i} position={p}>
          <mesh>
            <sphereGeometry args={[0.075, 12, 12]} />
            <meshBasicMaterial ref={i === 0 ? nodeMat : undefined} color={i % 4 === 0 ? accent : color} transparent />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.14, 12, 12]} />
            <meshBasicMaterial
              ref={i === 0 ? glowMat : undefined}
              color={i % 4 === 0 ? accent : color}
              transparent
              opacity={0.18}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ─────────── Workspace grid: the "developer environment" landing ─────────── */
export function WorkspaceGrid({ opacityRef }: { opacityRef?: React.RefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const mats = useRef<THREE.Material[]>([]);

  const lines = useMemo(() => {
    const verts: number[] = [];
    const size = 40;
    const step = 2;
    for (let i = -size; i <= size; i += step) {
      verts.push(-size, 0, i, size, 0, i);
      verts.push(i, 0, -size, i, 0, size);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    return g;
  }, []);

  useFrame((_, delta) => {
    if (group.current) group.current.position.z = (group.current.position.z + delta * 3) % 4;
    const o = opacityRef?.current ?? 1;
    for (const m of mats.current) if (m) (m as THREE.LineBasicMaterial).opacity = o * 0.4;
  });

  return (
    <group ref={group} position={[0, -3.2, 0]}>
      <lineSegments geometry={lines}>
        <lineBasicMaterial
          ref={(m) => {
            if (m) mats.current[0] = m;
          }}
          color="#a78bfa"
          transparent
          opacity={0.4}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  );
}
