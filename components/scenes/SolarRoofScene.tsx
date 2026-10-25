"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import { useInView } from "../../utils/useInView";

/* Rooftop solar in 3D: a day cycle loops — the sun rises, sunlight particles
   stream into the roof panels, the panels glow as they generate, energy runs
   down the cable into a battery, and at night the stored energy lights the house. */

const DAY = 16; // seconds per full day/night loop
const DAYLIGHT = 0.64; // share of the loop the sun is above the horizon
const SUN = "#ffd27a";
const ENERGY = "#38bdf8";
const PHOTONS = 36;

const NIGHT_SKY = new THREE.Color("#05050d");
const DAWN_SKY = new THREE.Color("#2a1438");
const DAY_SKY = new THREE.Color("#1d2150");
const LOW_SUN = new THREE.Color("#ff9a4d");
const HIGH_SUN = new THREE.Color("#fff3d6");

// Shared across the scene and the DOM readout, written every frame (no re-renders)
interface SimState {
  elevation: number;
  generation: number;
  battery: number;
  sunPos: THREE.Vector3;
}

type ReadoutRefs = {
  phase: React.RefObject<HTMLSpanElement | null>;
  sun: React.RefObject<HTMLSpanElement | null>;
  gen: React.RefObject<HTMLSpanElement | null>;
  battery: React.RefObject<HTMLSpanElement | null>;
};

function usePanelTexture() {
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 128;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#0b1433";
    ctx.fillRect(0, 0, 128, 128);
    ctx.strokeStyle = "rgba(170, 196, 255, 0.55)";
    ctx.lineWidth = 2;
    for (let i = 0; i <= 128; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 128);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(128, i);
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

function useGlowTexture() {
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 128;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.25, "rgba(255,230,170,0.55)");
    g.addColorStop(1, "rgba(255,200,120,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

/** Drives the day cycle: sun path, sky colour, light, generation and battery level */
function DayCycle({ sim, readout }: { sim: React.RefObject<SimState>; readout: ReadoutRefs }) {
  const { scene } = useThree();
  const sunLight = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const sunMesh = useRef<THREE.Group>(null);
  const glow = useRef<THREE.SpriteMaterial>(null);
  const glowTexture = useGlowTexture();
  const sky = useMemo(() => new THREE.Color(), []);
  const lastLabel = useRef("");

  useEffect(() => {
    scene.background = new THREE.Color(NIGHT_SKY);
    scene.fog = new THREE.Fog(NIGHT_SKY.getHex(), 18, 40);
  }, [scene]);

  useFrame(({ clock }, delta) => {
    const s = sim.current;
    const phase = (clock.elapsedTime % DAY) / DAY;
    const theta = phase < DAYLIGHT ? (phase / DAYLIGHT) * Math.PI : Math.PI + ((phase - DAYLIGHT) / (1 - DAYLIGHT)) * Math.PI;

    s.sunPos.set(-Math.cos(theta) * 9, Math.sin(theta) * 7 + 0.4, 2.5);
    s.elevation = Math.max(0, Math.sin(theta));
    s.generation = THREE.MathUtils.smoothstep(s.elevation, 0.08, 0.85);

    // Battery charges while the sun is up and drains overnight lighting the house
    const dt = Math.min(delta, 0.05);
    s.battery = THREE.MathUtils.clamp(s.battery + (s.generation * 0.16 - (s.elevation < 0.02 ? 0.09 : 0.01)) * dt, 0, 1);

    if (sunMesh.current) sunMesh.current.position.copy(s.sunPos);
    if (glow.current) glow.current.opacity = s.sunPos.y > -0.5 ? 0.35 + s.elevation * 0.65 : 0;

    const low = 1 - THREE.MathUtils.smoothstep(s.elevation, 0, 0.45);
    if (sunLight.current) {
      sunLight.current.position.copy(s.sunPos);
      sunLight.current.intensity = 0.05 + s.elevation * 2.6;
      sunLight.current.color.copy(HIGH_SUN).lerp(LOW_SUN, low);
    }
    if (hemi.current) hemi.current.intensity = 0.3 + s.elevation * 0.5;

    sky.copy(NIGHT_SKY).lerp(DAWN_SKY, Math.min(1, s.elevation * 3) * low).lerp(DAY_SKY, s.elevation * (1 - low));
    // The frame loop can start before the setup effect, so create these lazily
    if (!(scene.background instanceof THREE.Color)) scene.background = new THREE.Color(NIGHT_SKY);
    if (!(scene.fog instanceof THREE.Fog)) scene.fog = new THREE.Fog(NIGHT_SKY.getHex(), 18, 40);
    scene.background.copy(sky);
    scene.fog.color.copy(sky);

    const label =
      s.elevation <= 0 ? "NIGHT" : phase < DAYLIGHT * 0.2 ? "SUNRISE" : phase < DAYLIGHT * 0.42 ? "MORNING" : phase < DAYLIGHT * 0.58 ? "NOON" : phase < DAYLIGHT * 0.8 ? "AFTERNOON" : "SUNSET";
    if (label !== lastLabel.current && readout.phase.current) {
      lastLabel.current = label;
      readout.phase.current.textContent = label;
    }
    if (readout.sun.current) readout.sun.current.style.transform = `scaleX(${s.elevation})`;
    if (readout.gen.current) readout.gen.current.style.transform = `scaleX(${s.generation})`;
    if (readout.battery.current) readout.battery.current.style.transform = `scaleX(${s.battery})`;
  });

  return (
    <>
      <ambientLight intensity={0.22} />
      <hemisphereLight ref={hemi} args={["#a5b4fc", "#120f22", 0.3]} />
      <directionalLight ref={sunLight} intensity={1} />
      <group ref={sunMesh}>
        <mesh>
          <sphereGeometry args={[0.7, 32, 32]} />
          <meshBasicMaterial color={SUN} toneMapped={false} />
        </mesh>
        <sprite scale={4.5}>
          <spriteMaterial ref={glow} map={glowTexture} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
      </group>
    </>
  );
}

const ROOF_ANGLE = Math.atan2(1.15, 1.9);

/** Front roof slope with the panel array; reports each panel's world position for the sunlight particles */
function SolarRoof({ sim, targets }: { sim: React.RefObject<SimState>; targets: React.RefObject<THREE.Vector3[]> }) {
  const panelTexture = usePanelTexture();
  const panelMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: panelTexture,
        color: "#ffffff",
        metalness: 0.55,
        roughness: 0.25,
        emissive: new THREE.Color(ENERGY),
        emissiveMap: panelTexture,
        emissiveIntensity: 0.1,
      }),
    [panelTexture]
  );
  useEffect(() => () => panelMaterial.dispose(), [panelMaterial]);

  const panels = useRef<(THREE.Mesh | null)[]>([]);
  const cells = useMemo(() => {
    const list: [number, number][] = [];
    for (const z of [-0.52, 0.46]) for (const x of [-1.56, -0.52, 0.52, 1.56]) list.push([x, z]);
    return list;
  }, []);

  useFrame(({ clock }) => {
    if (targets.current.length === 0) {
      targets.current = panels.current.filter(Boolean).map((p) => p!.getWorldPosition(new THREE.Vector3()));
    }
    const s = sim.current;
    panelMaterial.emissiveIntensity = 0.08 + s.generation * (1.1 + Math.sin(clock.elapsedTime * 6) * 0.08);
  });

  return (
    <group position={[0, 2.2 + 1.15 / 2, 0.95]} rotation-x={ROOF_ANGLE}>
      <mesh>
        <boxGeometry args={[4.9, 0.1, 2.3]} />
        <meshStandardMaterial color="#3a2f5c" roughness={0.8} />
      </mesh>
      {cells.map(([x, z], i) => (
        <mesh
          key={`${x}-${z}`}
          ref={(m) => {
            panels.current[i] = m;
          }}
          position={[x, 0.09, z]}
          material={panelMaterial}
        >
          <boxGeometry args={[0.98, 0.05, 0.9]} />
        </mesh>
      ))}
    </group>
  );
}

function House({ sim }: { sim: React.RefObject<SimState> }) {
  const windowMat = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(() => {
    const s = sim.current;
    // Windows are lit by the battery once it gets dark
    if (windowMat.current) windowMat.current.emissiveIntensity = (1 - s.elevation) * (0.15 + s.battery * 2.2);
  });

  const gable = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-1.6, 0);
    shape.lineTo(1.6, 0);
    shape.lineTo(0, 1.15);
    shape.closePath();
    return new THREE.ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: false });
  }, []);
  useEffect(() => () => gable.dispose(), [gable]);

  return (
    <group>
      <mesh position={[0, 1.1, 0]}>
        <boxGeometry args={[4.4, 2.2, 3.2]} />
        <meshStandardMaterial color="#e6e1f3" roughness={0.7} />
      </mesh>
      {[-2.2, 2.1].map((x) => (
        <mesh key={x} geometry={gable} position={[x, 2.2, 0]} rotation-y={Math.PI / 2}>
          <meshStandardMaterial color="#d8d2ea" roughness={0.7} />
        </mesh>
      ))}
      <mesh position={[0, 2.2 + 1.15 / 2, -0.95]} rotation-x={-ROOF_ANGLE}>
        <boxGeometry args={[4.9, 0.1, 2.3]} />
        <meshStandardMaterial color="#3a2f5c" roughness={0.8} />
      </mesh>
      {/* Door and windows on the sunny side */}
      <mesh position={[0.9, 0.62, 1.62]}>
        <boxGeometry args={[0.7, 1.24, 0.05]} />
        <meshStandardMaterial color="#3b2a6b" roughness={0.5} />
      </mesh>
      {[-1.2, -0.2].map((x) => (
        <mesh key={x} position={[x, 1.2, 1.62]}>
          <boxGeometry args={[0.72, 0.6, 0.05]} />
          <meshStandardMaterial ref={x === -1.2 ? windowMat : undefined} color="#141129" emissive="#ffd9a0" emissiveIntensity={0.3} />
        </mesh>
      ))}
    </group>
  );
}

/** Sunlight particles travelling from the sun into the panels */
function Photons({ sim, targets }: { sim: React.RefObject<SimState>; targets: React.RefObject<THREE.Vector3[]> }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const state = useMemo(
    () =>
      Array.from({ length: PHOTONS }, (_, i) => ({
        t: i / PHOTONS,
        speed: 0.7 + Math.random() * 0.6,
        target: i % 8,
        jitter: new THREE.Vector3((Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.8),
      })),
    []
  );
  const m = useMemo(() => new THREE.Object3D(), []);
  const p = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    const inst = mesh.current;
    const s = sim.current;
    const list = targets.current;
    if (!inst || list.length === 0) return;
    const active = s.generation > 0.03;

    state.forEach((ph, i) => {
      ph.t += delta * ph.speed * 0.9;
      if (ph.t >= 1) {
        ph.t -= 1;
        ph.target = Math.floor(Math.random() * list.length);
      }
      const target = list[ph.target % list.length];
      p.copy(s.sunPos).add(ph.jitter).lerp(target, ph.t);
      m.position.copy(p);
      const size = active ? (0.025 + Math.sin(ph.t * Math.PI) * 0.035) * (0.5 + s.generation) : 0;
      m.scale.setScalar(size);
      m.updateMatrix();
      inst.setMatrixAt(i, m.matrix);
    });
    inst.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, PHOTONS]} frustumCulled={false}>
      <sphereGeometry args={[1, 10, 10]} />
      <meshBasicMaterial color={SUN} toneMapped={false} transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} />
    </instancedMesh>
  );
}

/** Cable from the roof to the battery, with energy pulses running down it */
function EnergyLine({ sim }: { sim: React.RefObject<SimState> }) {
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(2.3, 2.15, 1.7),
        new THREE.Vector3(2.5, 1.95, 1.7),
        new THREE.Vector3(2.55, 0.95, 1.55),
        new THREE.Vector3(3.15, 0.55, 1.25),
      ]),
    []
  );
  const cable = useMemo(() => new THREE.TubeGeometry(curve, 40, 0.035, 8, false), [curve]);
  useEffect(() => () => cable.dispose(), [cable]);

  const pulses = useRef<(THREE.Mesh | null)[]>([]);
  const bars = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const offset = useRef(0);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    const s = sim.current;
    offset.current = (offset.current + delta * (0.2 + s.generation * 0.9)) % 1;
    pulses.current.forEach((pulse, i) => {
      if (!pulse) return;
      curve.getPoint((offset.current + i / pulses.current.length) % 1, tmp);
      pulse.position.copy(tmp);
      pulse.scale.setScalar(s.generation > 0.05 ? 1 : 0);
    });
    // Battery gauge: four cells light up as the charge rises
    bars.current.forEach((bar, i) => {
      if (bar) bar.emissiveIntensity = s.battery > (i + 0.5) / 4 ? 1.6 : 0.05;
    });
  });

  return (
    <group>
      <mesh geometry={cable}>
        <meshStandardMaterial color="#1c1a2e" roughness={0.5} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh
          key={i}
          ref={(mm) => {
            pulses.current[i] = mm;
          }}
        >
          <sphereGeometry args={[0.07, 12, 12]} />
          <meshBasicMaterial color={ENERGY} toneMapped={false} />
        </mesh>
      ))}
      {/* Battery unit */}
      <group position={[3.4, 0, 1.15]}>
        <mesh position={[0, 0.55, 0]}>
          <boxGeometry args={[0.72, 1.1, 0.5]} />
          <meshStandardMaterial color="#17152a" metalness={0.4} roughness={0.4} />
        </mesh>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[0, 0.22 + i * 0.22, 0.26]}>
            <boxGeometry args={[0.46, 0.14, 0.02]} />
            <meshStandardMaterial
              ref={(mat) => {
                bars.current[i] = mat;
              }}
              color="#0b2a3a"
              emissive={ENERGY}
              emissiveIntensity={0.05}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Surroundings() {
  const trees: [number, number, number][] = [
    [-4.4, 0, -1.8],
    [-5.2, 0, 1.6],
    [4.9, 0, -2.6],
  ];
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2}>
        <circleGeometry args={[16, 64]} />
        <meshStandardMaterial color="#110f20" roughness={1} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 0.4]}>
        <circleGeometry args={[6.2, 64]} />
        <meshStandardMaterial color="#17223a" roughness={1} />
      </mesh>
      {trees.map((p, i) => (
        <group key={i} position={p} scale={0.9 + i * 0.15}>
          <mesh position={[0, 0.45, 0]}>
            <cylinderGeometry args={[0.08, 0.12, 0.9, 8]} />
            <meshStandardMaterial color="#3b2f2a" />
          </mesh>
          <mesh position={[0, 1.35, 0]}>
            <coneGeometry args={[0.7, 1.6, 8]} />
            <meshStandardMaterial color="#1f6f5c" roughness={0.8} flatShading />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function SolarRoofScene({ fallbackImage }: { fallbackImage?: string }) {
  const sim = useRef<SimState>({ elevation: 0, generation: 0, battery: 0.35, sunPos: new THREE.Vector3(-11, 0, 6) });
  const targets = useRef<THREE.Vector3[]>([]);
  const readout: ReadoutRefs = {
    phase: useRef<HTMLSpanElement>(null),
    sun: useRef<HTMLSpanElement>(null),
    gen: useRef<HTMLSpanElement>(null),
    battery: useRef<HTMLSpanElement>(null),
  };
  const [coarse, setCoarse] = useState(false);
  useEffect(() => setCoarse(window.matchMedia("(pointer: coarse)").matches), []);
  const [wrap, inView] = useInView<HTMLDivElement>();

  return (
    <div ref={wrap} className="absolute inset-0">
      <Canvas
        camera={{ position: [8.5, 5.4, 10], fov: 40 }}
        dpr={[1, 1.5]}
        frameloop={inView ? "always" : "never"}
        gl={{ antialias: true }}
        fallback={
          // eslint-disable-next-line @next/next/no-img-element
          fallbackImage ? <img src={fallbackImage} alt="Rooftop solar diagram" className="w-full h-full object-cover" /> : null
        }
      >
        <DayCycle sim={sim} readout={readout} />
        <Stars radius={60} depth={30} count={1200} factor={3} saturation={0} fade speed={0.4} />
        <Surroundings />
        <House sim={sim} />
        <SolarRoof sim={sim} targets={targets} />
        <Photons sim={sim} targets={targets} />
        <EnergyLine sim={sim} />
        <OrbitControls
          enabled={!coarse}
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.35}
          minPolarAngle={0.7}
          maxPolarAngle={1.35}
          target={[0, 1.8, 0]}
        />
      </Canvas>

      <div className="scene-panel scene-panel--solar">
        <div className="scene-panel__title">
          <span className="scene-live scene-live--sun" /> LIVE SIMULATION ·{" "}
          <span ref={readout.phase} className="text-white">
            SUNRISE
          </span>
        </div>
        {[
          { label: "SUN", ref: readout.sun, color: SUN },
          { label: "GENERATION", ref: readout.gen, color: "#a78bfa" },
          { label: "BATTERY", ref: readout.battery, color: ENERGY },
        ].map((row) => (
          <div key={row.label} className="scene-meter">
            <span className="scene-meter__label">{row.label}</span>
            <span className="scene-meter__track">
              <span ref={row.ref} className="scene-meter__fill" style={{ background: row.color }} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
