"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { useInView } from "../../utils/useInView";

/* The blood donor network in 3D: the hospital broadcasts a request, links draw
   out to the three matched donors in rank order, data packets run along them,
   and donor 01 answers back. Ineligible donors stay grey and unlinked. */

const RED = "#ff3b5c";
const REPLY = "#38bdf8";
const HOSPITAL_TOP = new THREE.Vector3(0, 2.05, 0);

type Donor = { position: [number, number, number]; group?: string; rank: number };

const DONORS: Donor[] = [
  { position: [3.8, 0, -2.3], group: "O−", rank: 1 },
  { position: [-3.4, 0, -3.3], group: "A+", rank: 2 },
  { position: [2.5, 0, 4.2], group: "O+", rank: 3 },
  { position: [-5.9, 0, 2.3], rank: 0 },
  { position: [6.6, 0, 1.6], rank: 0 },
  { position: [-1.3, 0, 6.8], rank: 0 },
  { position: [5.3, 0, -5.6], rank: 0 },
  { position: [-6.9, 0, -1.7], rank: 0 },
  { position: [0.7, 0, -7], rank: 0 },
];

const MATCHED = DONORS.filter((d) => d.rank > 0).sort((a, b) => a.rank - b.rank);

function PulseRings() {
  const rings = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(({ clock }) => {
    rings.current.forEach((ring, i) => {
      if (!ring) return;
      const p = (clock.elapsedTime * 0.32 + i / 3) % 1;
      ring.scale.setScalar(0.6 + p * 8.5);
      (ring.material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.55;
    });
  });
  return (
    <>
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          ref={(m) => {
            rings.current[i] = m;
          }}
          rotation-x={-Math.PI / 2}
          position={[0, 0.03, 0]}
        >
          <ringGeometry args={[0.94, 1, 72]} />
          <meshBasicMaterial color={RED} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
        </mesh>
      ))}
    </>
  );
}

function Hospital() {
  const beacon = useRef<THREE.MeshBasicMaterial>(null);
  const light = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    const pulse = 0.5 + 0.5 * Math.sin(clock.elapsedTime * 4);
    if (beacon.current) beacon.current.color.setScalar(1).lerp(new THREE.Color(RED), 1 - pulse * 0.4);
    if (light.current) light.current.intensity = 6 + pulse * 10;
  });

  const windows = useMemo(() => {
    const list: [number, number][] = [];
    for (const y of [0.55, 1.15]) for (const x of [-0.75, -0.25, 0.25, 0.75]) list.push([x, y]);
    return list;
  }, []);

  return (
    <group>
      <mesh position={[0, 0.9, 0]} castShadow>
        <boxGeometry args={[2.3, 1.8, 1.7]} />
        <meshStandardMaterial color="#ebe7f7" roughness={0.55} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.5, 1.15]}>
        <boxGeometry args={[1.1, 1, 0.6]} />
        <meshStandardMaterial color="#d9d4ea" roughness={0.6} />
      </mesh>
      {windows.map(([x, y]) => (
        <mesh key={`${x}-${y}`} position={[x, y, 0.86]}>
          <boxGeometry args={[0.32, 0.24, 0.03]} />
          <meshStandardMaterial color="#1e1b3a" emissive="#a5b4fc" emissiveIntensity={0.9} />
        </mesh>
      ))}
      {/* Red cross on the entrance wing */}
      <group position={[0, 0.62, 1.46]}>
        <mesh>
          <boxGeometry args={[0.46, 0.13, 0.04]} />
          <meshBasicMaterial color={RED} toneMapped={false} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.13, 0.46, 0.04]} />
          <meshBasicMaterial color={RED} toneMapped={false} />
        </mesh>
      </group>
      {/* Roof helipad + beacon */}
      <mesh position={[0, 1.81, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.42, 0.5, 40]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
      </mesh>
      <mesh position={[0, 2.05, 0]}>
        <sphereGeometry args={[0.13, 20, 20]} />
        <meshBasicMaterial ref={beacon} color={RED} toneMapped={false} />
      </mesh>
      <pointLight ref={light} position={[0, 2.2, 0]} color={RED} distance={7} decay={2} />
      <Html position={[0, 3.45, 0]} center distanceFactor={11} zIndexRange={[20, 0]}>
        <div className="scene-tag scene-tag--hospital">HOSPITAL · REQUEST O−</div>
      </Html>
    </group>
  );
}

function DonorFigure({ donor, index }: { donor: Donor; index: number }) {
  const body = useRef<THREE.Group>(null);
  const halo = useRef<THREE.Mesh>(null);
  const matched = donor.rank > 0;

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (body.current && matched) body.current.position.y = Math.sin(t * 2 + index) * 0.08;
    if (halo.current) {
      const p = (t * 0.8 + index * 0.3) % 1;
      halo.current.scale.setScalar(0.6 + p * 0.9);
      (halo.current.material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.7;
    }
  });

  const color = matched ? RED : "#4a4760";
  return (
    <group position={donor.position}>
      <group ref={body}>
        <mesh position={[0, 0.48, 0]}>
          <capsuleGeometry args={[0.2, 0.42, 6, 14]} />
          <meshStandardMaterial
            color={color}
            emissive={matched ? RED : "#000000"}
            emissiveIntensity={matched ? 0.55 : 0}
            roughness={0.4}
            transparent={!matched}
            opacity={matched ? 1 : 0.65}
          />
        </mesh>
        <mesh position={[0, 1.02, 0]}>
          <sphereGeometry args={[0.17, 20, 20]} />
          <meshStandardMaterial
            color={matched ? "#ffd1da" : "#5b5873"}
            emissive={matched ? RED : "#000000"}
            emissiveIntensity={matched ? 0.25 : 0}
            transparent={!matched}
            opacity={matched ? 1 : 0.65}
          />
        </mesh>
      </group>
      {matched && (
        <>
          <mesh ref={halo} rotation-x={-Math.PI / 2} position={[0, 0.02, 0]}>
            <ringGeometry args={[0.36, 0.44, 40]} />
            <meshBasicMaterial color={RED} transparent depthWrite={false} toneMapped={false} />
          </mesh>
          <Html position={[0, 1.55, 0]} center distanceFactor={11} zIndexRange={[20, 0]}>
            <div className={`scene-tag ${donor.rank === 1 ? "scene-tag--accepted" : ""}`}>
              {donor.group} · MATCH 0{donor.rank}
              {donor.rank === 1 && <span> · ACCEPTED</span>}
            </div>
          </Html>
        </>
      )}
    </group>
  );
}

function Link({ donor, order }: { donor: Donor; order: number }) {
  const [dx, , dz] = donor.position;
  const curve = useMemo(() => {
    const end = new THREE.Vector3(dx, 1.05, dz);
    const mid = HOSPITAL_TOP.clone().lerp(end, 0.5);
    mid.y += 1.6 + end.length() * 0.12;
    return new THREE.QuadraticBezierCurve3(HOSPITAL_TOP.clone(), mid, end);
  }, [dx, dz]);

  const geometry = useMemo(() => new THREE.TubeGeometry(curve, 64, 0.028, 8, false), [curve]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const outgoing = useRef<THREE.Group>(null);
  const reply = useRef<THREE.Group>(null);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    // Links draw out one after another, in rank order
    const draw = THREE.MathUtils.clamp((t - 0.6 - order * 0.7) / 1.1, 0, 1);
    const total = geometry.index ? geometry.index.count : 0;
    geometry.setDrawRange(0, Math.floor((total * draw) / 6) * 6);

    const live = draw >= 1;
    if (outgoing.current) {
      outgoing.current.visible = live;
      curve.getPoint((t * 0.42 + order * 0.33) % 1, tmp);
      outgoing.current.position.copy(tmp);
    }
    if (reply.current) {
      reply.current.visible = live;
      curve.getPoint(1 - ((t * 0.42 + 0.5) % 1), tmp);
      reply.current.position.copy(tmp);
    }
  });

  return (
    <group>
      <mesh geometry={geometry}>
        <meshBasicMaterial color={RED} transparent opacity={0.7} toneMapped={false} />
      </mesh>
      <group ref={outgoing} visible={false}>
        <mesh>
          <sphereGeometry args={[0.09, 14, 14]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.24, 14, 14]} />
          <meshBasicMaterial color={RED} transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      </group>
      {/* Only the accepting donor sends a response back */}
      {donor.rank === 1 && (
        <group ref={reply} visible={false}>
          <mesh>
            <sphereGeometry args={[0.09, 14, 14]} />
            <meshBasicMaterial color="#e0f2fe" toneMapped={false} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.24, 14, 14]} />
            <meshBasicMaterial color={REPLY} transparent opacity={0.4} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        </group>
      )}
    </group>
  );
}

function Ground() {
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2}>
        <circleGeometry args={[10.5, 72]} />
        <meshStandardMaterial color="#0d0b18" roughness={0.95} />
      </mesh>
      {[2.6, 5.2, 7.8].map((r) => (
        <mesh key={r} rotation-x={-Math.PI / 2} position={[0, 0.01, 0]}>
          <ringGeometry args={[r - 0.015, r + 0.015, 96]} />
          <meshBasicMaterial color="#ff6b85" transparent opacity={0.22} />
        </mesh>
      ))}
      <gridHelper args={[21, 21, "#2a2445", "#1a1630"]} position={[0, 0.005, 0]} />
    </group>
  );
}

export default function BloodNetworkScene({ fallbackImage }: { fallbackImage?: string }) {
  const [coarse, setCoarse] = useState(false);
  useEffect(() => setCoarse(window.matchMedia("(pointer: coarse)").matches), []);
  const [wrap, inView] = useInView<HTMLDivElement>();

  return (
    <div ref={wrap} className="absolute inset-0">
      <Canvas
        camera={{ position: [0, 8.2, 12.5], fov: 38 }}
        dpr={[1, 1.5]}
        frameloop={inView ? "always" : "never"}
        gl={{ antialias: true, alpha: true }}
        fallback={
          // eslint-disable-next-line @next/next/no-img-element
          fallbackImage ? <img src={fallbackImage} alt="Donor matching diagram" className="w-full h-full object-cover" /> : null
        }
      >
        <color attach="background" args={["#07060f"]} />
        <fog attach="fog" args={["#07060f", 14, 30]} />
        <ambientLight intensity={0.35} />
        <hemisphereLight args={["#a78bfa", "#0b0a14", 0.55]} />
        <directionalLight position={[5, 10, 6]} intensity={1.3} />

        <Ground />
        <PulseRings />
        <Hospital />
        {DONORS.map((d, i) => (
          <DonorFigure key={i} donor={d} index={i} />
        ))}
        {MATCHED.map((d, i) => (
          <Link key={d.rank} donor={d} order={i} />
        ))}
        <Sparkles count={70} scale={[18, 5, 18]} position={[0, 2.5, 0]} size={2.2} speed={0.3} color="#ff8fa3" opacity={0.45} />

        <OrbitControls
          enabled={!coarse}
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.55}
          minPolarAngle={0.55}
          maxPolarAngle={1.2}
          target={[0, 1, 0]}
        />
      </Canvas>

      {/* Ranked shortlist, mirroring what the 3D scene is doing */}
      <div className="scene-panel">
        <div className="scene-panel__title">
          <span className="scene-live" /> LIVE MATCHING
        </div>
        {MATCHED.map((d) => (
          <div key={d.rank} className={`scene-row ${d.rank === 1 ? "scene-row--on" : ""}`}>
            <span className="scene-row__rank">0{d.rank}</span>
            <span>DONOR · {d.group}</span>
            <span className="scene-row__state">{d.rank === 1 ? "ACCEPTED" : "NOTIFIED"}</span>
          </div>
        ))}
        <div className="scene-panel__legend">
          <span>
            <i style={{ background: RED }} /> MATCHED
          </span>
          <span>
            <i style={{ background: "#4a4760" }} /> INELIGIBLE
          </span>
        </div>
      </div>
    </div>
  );
}
