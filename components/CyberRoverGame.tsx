"use client";

import {
  memo,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent, RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Billboard, Grid, Stars, Text } from "@react-three/drei";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Crosshair,
} from "lucide-react";
import { useGame } from "../context/GameContext";
import { projects } from "../data/projects";
import { sound } from "../utils/soundFx";

type Vec3 = [number, number, number];

const ACID = "#a78bfa";

// ── World layout ──
const ARENA_RADIUS = 58; // drivable radius
const DOCK_RADIUS = 4.5; // proximity that triggers the docking prompt
const PAD_RADIUS = 4.2;
const PAD_HEIGHT = 0.35;
const ORB_PICKUP_RADIUS = 2.2;

// ── Rover physics (world units per second) ──
const MAX_SPEED = 26;
const MAX_REVERSE = -9;
const ACCEL = 15;
const REVERSE_ACCEL = 10;
const COAST_DRAG = 5;
const BRAKE_DECEL = 30;
const TURN_RATE = 1.9;
const WHEEL_RADIUS = 0.46;
const KMH_PER_UNIT = 7.2;

// ── Boost pads + speed effects ──
const BOOST_MULT = 1.45;
const BOOST_ACCEL = 22;
const BOOST_TIME = 1.2;
const BOOST_RADIUS = 2.4;
const STREAK_COUNT = 34;

// ── Camera ──
const CAM_DISTANCE = 9.5;
const CAM_HEIGHT = 4.2;
const BASE_FOV = 58;
const MAX_FOV_BOOST = 16;

const COMPASS_PX_PER_DEG = 2;
const BURST_LIFETIME = 0.9;

const STORAGE_ORBS = "shihap_game_orbs";
const STORAGE_DOCKS = "shihap_game_docks";

interface Station {
  id: string;
  label: string;
  projectSlug: string;
  position: Vec3;
  color: string;
  accent: string;
  kind: "solar" | "medical" | "radar";
}

const STATIONS: Station[] = [
  { id: "solar", label: "SOLAR AI BAY", projectSlug: "rooftop-solar-ai", position: [-24, 0, 28], color: ACID, accent: "#ffd27a", kind: "solar" },
  { id: "blood", label: "BLOOD NETWORK HUB", projectSlug: "blood-donor-network", position: [30, 0, 14], color: "#ff3b5c", accent: "#38bdf8", kind: "medical" },
  { id: "career", label: "CAREER AI OBSERVATORY", projectSlug: "career-guidance", position: [2, 0, -36], color: "#c084fc", accent: "#e9d5ff", kind: "radar" },
];

interface SkillOrbDef {
  id: string;
  label: string;
  position: Vec3;
  color: string;
}

const SKILL_ORBS: SkillOrbDef[] = [
  { id: "python", label: "PYTHON", position: [7, 0, 15], color: ACID },
  { id: "opencv", label: "OPENCV", position: [-12, 0, 8], color: "#38bdf8" },
  { id: "react", label: "REACT", position: [18, 0, -10], color: "#61dafb" },
  { id: "tensorflow", label: "TENSORFLOW", position: [-22, 0, -16], color: "#ff9f1c" },
  { id: "nextjs", label: "NEXT.JS", position: [2, 0, 40], color: "#f2f2f0" },
  { id: "sql", label: "SQL", position: [38, 0, -28], color: "#c084fc" },
];

const WHEELS: { position: Vec3; front: boolean }[] = [
  { position: [0.8, WHEEL_RADIUS, 1.12], front: true },
  { position: [-0.8, WHEEL_RADIUS, 1.12], front: true },
  { position: [0.8, WHEEL_RADIUS, -1.12], front: false },
  { position: [-0.8, WHEEL_RADIUS, -1.12], front: false },
];

const BOOST_PADS: { position: Vec3; heading: number }[] = [
  { position: [0, 0, 12], heading: 0 },
  { position: [-14, 0, -4], heading: -Math.PI / 2 },
  { position: [16, 0, 30], heading: Math.PI / 4 },
  { position: [22, 0, -22], heading: Math.PI },
];

interface ControlState {
  forward: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
  brake: boolean;
}

const emptyControls = (): ControlState => ({
  forward: false,
  back: false,
  left: false,
  right: false,
  brake: false,
});
const NO_INPUT: ControlState = emptyControls();

const KEY_MAP: Record<string, keyof ControlState> = {
  KeyW: "forward",
  ArrowUp: "forward",
  KeyS: "back",
  ArrowDown: "back",
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
  Space: "brake",
};

interface HudRefs {
  speed: RefObject<HTMLSpanElement | null>;
  speedBar: RefObject<HTMLDivElement | null>;
  gear: RefObject<HTMLSpanElement | null>;
  heading: RefObject<HTMLSpanElement | null>;
  compassTape: RefObject<HTMLDivElement | null>;
}

interface WorldCallbacks {
  onCollect: (index: number) => void;
  onNearStation: (index: number | null) => void;
}

interface BurstData {
  id: number;
  position: Vec3;
  color: string;
}

const COMPASS_NAMES: Record<number, string> = {
  0: "N", 45: "NE", 90: "E", 135: "SE", 180: "S", 225: "SW", 270: "W", 315: "NW",
};

// Three full turns of tape so the current bearing always has marks on both sides
const COMPASS_MARKS = Array.from({ length: 1080 / 15 + 1 }, (_, i) => {
  const deg = i * 15;
  const n = deg % 360;
  return { deg, label: COMPASS_NAMES[n], cardinal: n % 90 === 0, major: n % 45 === 0 };
});

function loadIndexList(key: string, max: number): number[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((n): n is number => Number.isInteger(n) && n >= 0 && n < max);
  } catch {
    return [];
  }
}

function saveIndexList(key: string, list: number[]) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {}
}

function approachZero(value: number, amount: number) {
  if (value > 0) return Math.max(0, value - amount);
  if (value < 0) return Math.min(0, value + amount);
  return 0;
}

// Deterministic PRNG so the skyline layout is stable between visits
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ═══════════════════════════ CYBER-ROVER ═══════════════════════════ */

function useCarbonFiberTexture() {
  const texture = useMemo(() => {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#08090b";
      ctx.fillRect(0, 0, size, size);
      const cell = size / 4;
      for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
          const weaveA = (x + y) % 2 === 0;
          const g = ctx.createLinearGradient(x * cell, y * cell, (x + 1) * cell, (y + 1) * cell);
          g.addColorStop(0, weaveA ? "#22262b" : "#101215");
          g.addColorStop(1, weaveA ? "#0f1113" : "#1d2024");
          ctx.fillStyle = g;
          ctx.fillRect(x * cell + 1, y * cell + 1, cell - 2, cell - 2);
        }
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(5, 5);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }, []);

  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

// Headlight cone whose vertex colours fade to black toward the far end. Under
// additive blending black adds nothing, so the beam dissolves instead of
// showing a hard translucent silhouette when seen from the chase camera.
function useBeamGeometry(length: number, radius: number) {
  const geometry = useMemo(() => {
    const geo = new THREE.ConeGeometry(radius, length, 24, 8, true);
    const pos = geo.getAttribute("position");
    const colors = new Float32Array(pos.count * 3);
    const tint = new THREE.Color("#e0e7ff");
    for (let i = 0; i < pos.count; i++) {
      const t = (pos.getY(i) + length / 2) / length; // 1 at the apex (lamp), 0 at the base
      const k = Math.pow(t, 2.2) * 0.12;
      colors[i * 3] = tint.r * k;
      colors[i * 3 + 1] = tint.g * k;
      colors[i * 3 + 2] = tint.b * k;
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [length, radius]);

  useEffect(() => () => geometry.dispose(), [geometry]);
  return geometry;
}

// Side profile of the car (z = length, y = height above the axle), extruded across its width.
// The two arcs in the bottom edge are the wheel arches.
function useCarBodyGeometry() {
  const geometry = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-1.86, -0.18);
    s.lineTo(-1.95, 0.3);
    s.quadraticCurveTo(-1.98, 0.62, -1.72, 0.66);
    s.lineTo(-1.05, 0.72);
    s.lineTo(0.95, 0.76);
    s.lineTo(1.6, 0.66);
    s.quadraticCurveTo(2.02, 0.6, 2.0, 0.28);
    s.lineTo(1.9, -0.18);
    s.lineTo(1.72, -0.18);
    s.lineTo(1.72, 0);
    s.absarc(1.12, 0, 0.6, 0, Math.PI, false);
    s.lineTo(0.52, -0.18);
    s.lineTo(-0.52, -0.18);
    s.lineTo(-0.52, 0);
    s.absarc(-1.12, 0, 0.6, 0, Math.PI, false);
    s.lineTo(-1.72, -0.18);
    s.lineTo(-1.86, -0.18);

    const geo = new THREE.ExtrudeGeometry(s, {
      depth: 1.44,
      bevelEnabled: true,
      bevelThickness: 0.08,
      bevelSize: 0.06,
      bevelSegments: 4,
      curveSegments: 24,
    });
    // Shape X → length (Z), extrusion → width (X), centred on the axle line
    geo.rotateY(-Math.PI / 2);
    geo.translate(0.72, 0, 0);
    geo.computeVertexNormals();
    return geo;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return geometry;
}

// Low teardrop glass canopy that sits on the body's beltline
function useCanopyGeometry() {
  const geometry = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-1.02, 0.7);
    s.quadraticCurveTo(-0.62, 1.22, 0.02, 1.24);
    s.quadraticCurveTo(0.5, 1.24, 0.96, 0.74);
    s.lineTo(-1.02, 0.7);
    const geo = new THREE.ExtrudeGeometry(s, {
      depth: 1.04,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.06,
      bevelSegments: 5,
      curveSegments: 24,
    });
    geo.rotateY(-Math.PI / 2);
    geo.translate(0.52, 0, 0);
    geo.computeVertexNormals();
    return geo;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return geometry;
}

// Procedural studio reflections for the paint and glass (no network fetch)
function useCarEnvironment() {
  const gl = useThree((s) => s.gl);
  const envMap = useMemo(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const tex = pmrem.fromScene(room, 0.04).texture;
    room.dispose();
    pmrem.dispose();
    return tex;
  }, [gl]);
  useEffect(() => () => envMap.dispose(), [envMap]);
  return envMap;
}

function Wheel({
  position,
  spinRef,
  steerRef,
}: {
  position: Vec3;
  spinRef: (g: THREE.Group | null) => void;
  steerRef: (g: THREE.Group | null) => void;
}) {
  // side = +1 on the right (world +X). Inside the axle frame local +Y points to world -X,
  // so "outboard" is -side along local Y.
  const side = Math.sign(position[0]) || 1;
  const out = -side;
  return (
    // outer group = steering pivot, middle = axle alignment (local Y becomes the axle), inner = spin
    <group position={position} ref={steerRef}>
      {/* Brake caliper steers with the wheel but doesn't spin */}
      <mesh position={[side * 0.05, 0.19, -0.13]}>
        <boxGeometry args={[0.07, 0.2, 0.24]} />
        <meshStandardMaterial color="#ff2d55" emissive="#ff2d55" emissiveIntensity={0.4} roughness={0.35} />
      </mesh>
      <group rotation-z={Math.PI / 2}>
        <group ref={spinRef}>
          {/* Tyre */}
          <mesh rotation-x={Math.PI / 2}>
            <torusGeometry args={[WHEEL_RADIUS - 0.12, 0.12, 14, 40]} />
            <meshStandardMaterial color="#09090f" roughness={0.92} />
          </mesh>
          {/* Recessed rim barrel */}
          <mesh position={[0, -out * 0.04, 0]}>
            <cylinderGeometry args={[WHEEL_RADIUS - 0.13, WHEEL_RADIUS - 0.13, 0.08, 32]} />
            <meshStandardMaterial color="#15142a" metalness={0.9} roughness={0.3} />
          </mesh>
          {/* Five-spoke face */}
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh key={i} position={[0, out * 0.1, 0]} rotation-y={(i / 5) * Math.PI * 2}>
              <boxGeometry args={[(WHEEL_RADIUS - 0.13) * 1.95, 0.035, 0.075]} />
              <meshStandardMaterial color="#d6d3f0" metalness={1} roughness={0.18} />
            </mesh>
          ))}
          {/* Neon rim lip + centre cap */}
          <mesh position={[0, out * 0.11, 0]} rotation-x={Math.PI / 2}>
            <torusGeometry args={[WHEEL_RADIUS - 0.14, 0.016, 8, 48]} />
            <meshBasicMaterial color={ACID} toneMapped={false} />
          </mesh>
          <mesh position={[0, out * 0.115, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.04, 18]} />
            <meshBasicMaterial color={ACID} toneMapped={false} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

const Rover = memo(function Rover({
  controlsRef,
  pausedRef,
  collectedRef,
  callbacksRef,
  hud,
}: {
  controlsRef: RefObject<ControlState>;
  pausedRef: RefObject<boolean>;
  collectedRef: RefObject<Set<number>>;
  callbacksRef: RefObject<WorldCallbacks>;
  hud: HudRefs;
}) {
  const carbon = useCarbonFiberTexture();
  const envMap = useCarEnvironment();
  const bodyGeometry = useCarBodyGeometry();
  const canopyGeometry = useCanopyGeometry();
  const paint = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#3a24b8",
        metalness: 0.55,
        roughness: 0.32,
        clearcoat: 0.55,
        clearcoatRoughness: 0.12,
        envMap,
        envMapIntensity: 0.32,
      }),
    [envMap]
  );
  const glass = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#07071a",
        metalness: 0.9,
        roughness: 0.04,
        envMap,
        envMapIntensity: 0.45,
        emissive: new THREE.Color("#1e1b4b"),
        emissiveIntensity: 0.25,
      }),
    [envMap]
  );
  const trim = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: carbon,
        color: "#8f8aa8",
        metalness: 0.55,
        roughness: 0.35,
        envMap,
        envMapIntensity: 0.6,
      }),
    [carbon, envMap]
  );
  useEffect(
    () => () => {
      paint.dispose();
      glass.dispose();
      trim.dispose();
    },
    [paint, glass, trim]
  );
  const beamGeometry = useBeamGeometry(9, 1.5);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;

  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const underglow = useRef<THREE.MeshBasicMaterial>(null);
  const beamTarget = useRef<THREE.Object3D>(null);
  const spotLeft = useRef<THREE.SpotLight>(null);
  const spotRight = useRef<THREE.SpotLight>(null);
  const wheelSpin = useRef<(THREE.Group | null)[]>([]);
  const wheelSteer = useRef<(THREE.Group | null)[]>([]);
  const tailLight = useRef<THREE.MeshBasicMaterial>(null);
  const flames = useRef<(THREE.Mesh | null)[]>([]);
  const streaks = useRef<THREE.InstancedMesh>(null);
  const [streakData] = useState(() =>
    Array.from({ length: STREAK_COUNT }, () => ({
      x: (Math.random() - 0.5) * 7,
      y: 0.3 + Math.random() * 2.6,
      z: Math.random() * 18 - 8,
    }))
  );
  const [streakDummy] = useState(() => new THREE.Object3D());

  const [tmp] = useState(() => ({
    desired: new THREE.Vector3(),
    look: new THREE.Vector3(),
    lookTarget: new THREE.Vector3(0, 1.1, 5),
  }));

  const sim = useRef({
    x: 0,
    z: 0,
    y: 0,
    heading: 0, // chassis yaw (0 = facing +Z)
    velHeading: 0, // travel direction; lags behind heading while drifting
    camHeading: 0,
    speed: 0,
    steer: 0,
    nearStation: -1,
    lastKmh: -1,
    lastBearing: -1,
    lastGear: "",
    boost: 0,
    boostPad: -1,
  });

  // Spotlights aim at a target parented to the rover so the beams follow it
  useEffect(() => {
    const target = beamTarget.current;
    if (!target) return;
    if (spotLeft.current) spotLeft.current.target = target;
    if (spotRight.current) spotRight.current.target = target;
  }, []);

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const s = sim.current;
    const paused = pausedRef.current;
    const c = paused ? NO_INPUT : controlsRef.current;

    // ── Throttle, reverse, coasting ──
    if (c.forward && !c.back) {
      s.speed += (s.speed < 0 ? BRAKE_DECEL : ACCEL) * dt;
    } else if (c.back && !c.forward) {
      s.speed -= (s.speed > 0 ? BRAKE_DECEL : REVERSE_ACCEL) * dt;
    } else {
      s.speed = approachZero(s.speed, COAST_DRAG * dt);
    }
    if (c.brake || paused) s.speed = approachZero(s.speed, BRAKE_DECEL * dt);
    // Boost pads lift the top speed briefly, then it eases back down (no hard snap)
    if (s.boost > 0) {
      s.boost -= dt;
      s.speed += BOOST_ACCEL * dt;
    }
    const cap = s.boost > 0 ? MAX_SPEED * BOOST_MULT : MAX_SPEED;
    if (s.speed > cap) s.speed = THREE.MathUtils.damp(s.speed, cap, 2.2, dt);
    s.speed = THREE.MathUtils.clamp(s.speed, MAX_REVERSE, MAX_SPEED * BOOST_MULT);

    // ── Steering (needs rolling speed; inverts in reverse) ──
    const steerInput = (c.left ? 1 : 0) - (c.right ? 1 : 0);
    s.steer = THREE.MathUtils.damp(s.steer, steerInput, 8, dt);
    const grip = THREE.MathUtils.clamp(Math.abs(s.speed) / 6, 0, 1);
    const drifting = c.brake && Math.abs(s.speed) > 8;
    s.heading += s.steer * TURN_RATE * grip * (drifting ? 1.6 : 1) * Math.sign(s.speed) * dt;
    s.velHeading = THREE.MathUtils.damp(s.velHeading, s.heading, drifting ? 2.5 : 14, dt);

    s.x += Math.sin(s.velHeading) * s.speed * dt;
    s.z += Math.cos(s.velHeading) * s.speed * dt;

    // ── Arena boundary: clamp; hard hits bounce back, gentle contact just stops ──
    const r = Math.hypot(s.x, s.z);
    if (r > ARENA_RADIUS) {
      s.x *= ARENA_RADIUS / r;
      s.z *= ARENA_RADIUS / r;
      s.speed = Math.abs(s.speed) > 8 ? s.speed * -0.35 : s.speed * 0.5;
    }

    // ── Docking bays: pad height + proximity prompt ──
    let nearest = -1;
    let nearestDist = Infinity;
    for (let i = 0; i < STATIONS.length; i++) {
      const [sx, , sz] = STATIONS[i].position;
      const d = Math.hypot(s.x - sx, s.z - sz);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = i;
      }
    }
    s.y = THREE.MathUtils.damp(s.y, nearestDist < PAD_RADIUS ? PAD_HEIGHT : 0, 10, dt);
    const inRange = nearestDist < DOCK_RADIUS ? nearest : -1;
    if (inRange !== s.nearStation) {
      s.nearStation = inRange;
      callbacksRef.current.onNearStation(inRange === -1 ? null : inRange);
    }

    // ── Skill orb pickups ──
    for (let i = 0; i < SKILL_ORBS.length; i++) {
      if (collectedRef.current.has(i)) continue;
      const [ox, , oz] = SKILL_ORBS[i].position;
      if (Math.hypot(s.x - ox, s.z - oz) < ORB_PICKUP_RADIUS) {
        collectedRef.current.add(i);
        callbacksRef.current.onCollect(i);
      }
    }

    // ── Boost pads ──
    for (let i = 0; i < BOOST_PADS.length; i++) {
      const [bx, , bz] = BOOST_PADS[i].position;
      if (Math.hypot(s.x - bx, s.z - bz) < BOOST_RADIUS) {
        if (s.boostPad !== i && !paused) {
          s.boostPad = i;
          s.boost = BOOST_TIME;
          s.speed = Math.max(s.speed, MAX_SPEED * 0.9);
          sound.playBlip(1320, 0.12);
        }
      } else if (s.boostPad === i) {
        s.boostPad = -1;
      }
    }

    // ── Apply transforms ──
    if (root.current) {
      root.current.position.set(s.x, s.y, s.z);
      root.current.rotation.y = s.heading;
    }
    if (body.current) {
      // Roll outward in turns, squat on throttle, dive under braking
      const roll = s.steer * grip * 0.07 * Math.sign(s.speed || 1);
      const pitch = (c.forward ? -0.03 : 0) + (c.brake || (c.back && s.speed > 0) ? 0.035 : 0);
      body.current.rotation.z = THREE.MathUtils.damp(body.current.rotation.z, roll, 6, dt);
      body.current.rotation.x = THREE.MathUtils.damp(body.current.rotation.x, pitch, 6, dt);
    }
    const spin = (s.speed * dt) / WHEEL_RADIUS;
    for (const w of wheelSpin.current) if (w) w.rotation.y -= spin;
    WHEELS.forEach((wheel, i) => {
      const pivot = wheelSteer.current[i];
      if (wheel.front && pivot) pivot.rotation.y = s.steer * 0.45;
    });
    if (underglow.current) {
      underglow.current.opacity = 0.28 + (Math.abs(s.speed) / MAX_SPEED) * 0.3;
    }

    // ── Car effects: brake lights, exhaust flames, suspension, wind streaks ──
    const t = state.clock.elapsedTime;
    const ratioNow = Math.abs(s.speed) / MAX_SPEED;
    const braking = c.brake || (c.back && s.speed > 0.5);
    if (tailLight.current) tailLight.current.color.setRGB(1, 0.18, 0.33).multiplyScalar(braking ? 1.8 : 0.6);
    const boosting = s.boost > 0;
    for (const flame of flames.current) {
      if (!flame) continue;
      const on = (c.forward && !paused) || boosting;
      const len = on ? (boosting ? 2.2 : 0.8) + Math.random() * 0.35 + ratioNow * 0.5 : 0.001;
      const w = boosting ? 1.6 : 1;
      flame.scale.set(w, len, w);
      (flame.material as THREE.MeshBasicMaterial).color.set(boosting ? "#38bdf8" : "#8b5cf6");
    }
    if (body.current) {
      body.current.position.y =
        WHEEL_RADIUS + (ratioNow < 0.02 ? Math.sin(t * 2.4) * 0.012 : Math.sin(t * 22) * 0.006 * Math.min(1, ratioNow));
    }
    if (streaks.current) {
      const show = THREE.MathUtils.clamp((ratioNow - 0.45) / 0.55, 0, 1.3);
      const inst = streaks.current;
      streakData.forEach((d, i) => {
        d.z -= s.speed * dt * 1.6;
        if (d.z < -9) d.z += 20;
        if (d.z > 11) d.z -= 20;
        const x = Math.abs(d.x) < 1.4 ? Math.sign(d.x || 1) * (1.4 + Math.abs(d.x) * 0.3) : d.x;
        streakDummy.position.set(x, d.y, d.z);
        streakDummy.scale.set(1, 1, show * 3 + 0.0001);
        streakDummy.updateMatrix();
        inst.setMatrixAt(i, streakDummy.matrix);
      });
      inst.instanceMatrix.needsUpdate = true;
    }

    // ── Third-person follow camera ──
    s.camHeading = THREE.MathUtils.damp(s.camHeading, s.heading, 3.5, dt);
    tmp.desired.set(
      s.x - Math.sin(s.camHeading) * CAM_DISTANCE,
      s.y + CAM_HEIGHT,
      s.z - Math.cos(s.camHeading) * CAM_DISTANCE
    );
    camera.position.lerp(tmp.desired, 1 - Math.exp(-dt * 6));
    tmp.look.set(s.x + Math.sin(s.heading) * 5, s.y + 1.1, s.z + Math.cos(s.heading) * 5);
    tmp.lookTarget.lerp(tmp.look, 1 - Math.exp(-dt * 8));
    camera.lookAt(tmp.lookTarget);

    const speedRatio = Math.abs(s.speed) / MAX_SPEED;
    const targetFov = BASE_FOV + speedRatio * MAX_FOV_BOOST;
    if (Math.abs(camera.fov - targetFov) > 0.01) {
      camera.fov = THREE.MathUtils.damp(camera.fov, targetFov, 3, dt);
      camera.updateProjectionMatrix();
    }

    // ── DOM HUD (written directly, only when values change) ──
    const kmh = Math.round(Math.abs(s.speed) * KMH_PER_UNIT);
    if (kmh !== s.lastKmh) {
      s.lastKmh = kmh;
      if (hud.speed.current) hud.speed.current.textContent = String(kmh).padStart(3, "0");
      if (hud.speedBar.current) hud.speedBar.current.style.width = `${Math.min(100, speedRatio * 100)}%`;
    }
    const gear =
      c.brake && Math.abs(s.speed) > 0.5 ? "BRK" : s.speed < -0.3 ? "R" : s.speed > 0.3 ? "D" : "N";
    if (gear !== s.lastGear) {
      s.lastGear = gear;
      if (hud.gear.current) hud.gear.current.textContent = gear;
    }
    // Compass: N = +Z, bearings increase clockwise (turning right)
    const bearing = Math.round(((((-s.heading * 180) / Math.PI) % 360) + 360) % 360) % 360;
    if (bearing !== s.lastBearing) {
      s.lastBearing = bearing;
      if (hud.heading.current) hud.heading.current.textContent = `${String(bearing).padStart(3, "0")}°`;
      if (hud.compassTape.current) {
        hud.compassTape.current.style.transform = `translateX(${-(360 + bearing) * COMPASS_PX_PER_DEG}px)`;
      }
    }
  });

  return (
    <group ref={root}>
      {/* Contact shadow + neon underglow */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]} scale={[1, 2.2, 1]}>
        <circleGeometry args={[1.05, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.65} depthWrite={false} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.03, 0]} scale={[1, 2.3, 1]}>
        <circleGeometry args={[1.0, 32]} />
        <meshBasicMaterial
          ref={underglow}
          color={ACID}
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <pointLight position={[0, 0.3, 0]} color={ACID} intensity={7} distance={6} decay={2} />

      {/* Body (rolls and pitches independently of the wheels) */}
      <group ref={body} position={[0, WHEEL_RADIUS, 0]}>
        <mesh geometry={bodyGeometry} material={paint} />
        <mesh geometry={canopyGeometry} material={glass} />

        {/* Neon sills between the arches + beltline pinstripe */}
        {[-1, 1].map((side) => (
          <group key={side}>
            <mesh position={[side * 0.79, -0.1, 0]}>
              <boxGeometry args={[0.03, 0.05, 0.96]} />
              <meshBasicMaterial color={ACID} toneMapped={false} />
            </mesh>
            <mesh position={[side * 0.785, 0.5, 0.15]}>
              <boxGeometry args={[0.012, 0.016, 2.7]} />
              <meshBasicMaterial color="#c4b5fd" transparent opacity={0.85} toneMapped={false} />
            </mesh>
            {/* Mirror */}
            <mesh position={[side * 0.72, 0.9, 0.72]} material={paint}>
              <boxGeometry args={[0.22, 0.09, 0.14]} />
            </mesh>
          </group>
        ))}

        {/* LED headlights, front light bar and grille */}
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.46, 0.46, 1.98]} rotation-y={side * -0.32}>
            <boxGeometry args={[0.44, 0.05, 0.06]} />
            <meshBasicMaterial color="#eef2ff" toneMapped={false} />
          </mesh>
        ))}
        <mesh position={[0, 0.3, 2.06]}>
          <boxGeometry args={[1.05, 0.025, 0.02]} />
          <meshBasicMaterial color={ACID} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.06, 2.0]} material={trim}>
          <boxGeometry args={[1.0, 0.16, 0.06]} />
        </mesh>

        {/* Full-width tail light (brightens under braking) */}
        <mesh position={[0, 0.52, -2.02]}>
          <boxGeometry args={[1.42, 0.07, 0.03]} />
          <meshBasicMaterial ref={tailLight} color="#ff2d55" toneMapped={false} />
        </mesh>

        {/* Rear wing on swan-neck struts */}
        <mesh position={[0, 1.08, -1.66]} rotation-x={-0.1} material={trim}>
          <boxGeometry args={[1.72, 0.05, 0.38]} />
        </mesh>
        {[-0.55, 0.55].map((x) => (
          <mesh key={x} position={[x, 0.9, -1.62]} rotation-x={0.25} material={trim}>
            <boxGeometry args={[0.05, 0.36, 0.12]} />
          </mesh>
        ))}
        {[-0.86, 0.86].map((x) => (
          <mesh key={x} position={[x, 1.08, -1.66]}>
            <boxGeometry args={[0.02, 0.16, 0.4]} />
            <meshBasicMaterial color={ACID} toneMapped={false} />
          </mesh>
        ))}

        {/* Diffuser fins */}
        {[-0.45, -0.15, 0.15, 0.45].map((x) => (
          <mesh key={x} position={[x, -0.1, -1.9]} material={trim}>
            <boxGeometry args={[0.03, 0.14, 0.32]} />
          </mesh>
        ))}

        {/* Twin exhausts with throttle / boost flames */}
        {[-0.3, 0.3].map((x, i) => (
          <group key={x} position={[x, 0.02, -2.0]}>
            <mesh rotation-x={Math.PI / 2}>
              <cylinderGeometry args={[0.075, 0.085, 0.16, 16]} />
              <meshStandardMaterial color="#9c9ab8" metalness={1} roughness={0.2} />
            </mesh>
            <mesh
              ref={(m) => {
                flames.current[i] = m;
              }}
              position={[0, 0, -0.26]}
              rotation-x={-Math.PI / 2}
            >
              <coneGeometry args={[0.075, 0.5, 12, 1, true]} />
              <meshBasicMaterial
                color="#8b5cf6"
                transparent
                opacity={0.85}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                side={THREE.DoubleSide}
                toneMapped={false}
              />
            </mesh>
          </group>
        ))}
      </group>

      {WHEELS.map((w, i) => (
        <Wheel
          key={i}
          position={w.position}
          spinRef={(g) => {
            wheelSpin.current[i] = g;
          }}
          steerRef={(g) => {
            wheelSteer.current[i] = g;
          }}
        />
      ))}

      {/* Wind streaks that appear at speed */}
      <instancedMesh ref={streaks} args={[undefined, undefined, STREAK_COUNT]} frustumCulled={false}>
        <boxGeometry args={[0.025, 0.025, 1]} />
        <meshBasicMaterial
          color="#c4b5fd"
          transparent
          opacity={0.45}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </instancedMesh>

      {/* Headlights: real spotlights + visible volumetric cones */}
      {[-0.46, 0.46].map((x, i) => (
        <group key={x}>
          <spotLight
            ref={i === 0 ? spotLeft : spotRight}
            position={[x, WHEEL_RADIUS + 0.46, 2.0]}
            angle={0.42}
            penumbra={0.7}
            intensity={45}
            distance={38}
            decay={1.1}
            color="#e0e7ff"
          />
          <group position={[x, WHEEL_RADIUS + 0.46, 2.04]} rotation-x={0.12}>
            <mesh position={[0, 0, 4.5]} rotation-x={-Math.PI / 2} geometry={beamGeometry}>
              <meshBasicMaterial
                vertexColors
                transparent
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                side={THREE.DoubleSide}
                toneMapped={false}
              />
            </mesh>
          </group>
        </group>
      ))}
      <object3D ref={beamTarget} position={[0, 0, 14]} />
    </group>
  );
});

/* ═══════════════════════════ ENVIRONMENT ═══════════════════════════ */

function GuideRoad({ to, color }: { to: Vec3; color: string }) {
  const [tx, , tz] = to;
  const start = 3.4;
  const end = Math.hypot(tx, tz) - DOCK_RADIUS - 1;
  const length = end - start;
  const mid = start + length / 2;
  return (
    <group rotation-y={Math.atan2(tx, tz)}>
      <mesh position={[0, 0.015, mid]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[2.2, length]} />
        <meshBasicMaterial color={color} transparent opacity={0.05} depthWrite={false} toneMapped={false} />
      </mesh>
      {[-1.1, 1.1].map((x) => (
        <mesh key={x} position={[x, 0.02, mid]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[0.06, length]} />
          <meshBasicMaterial color={color} transparent opacity={0.45} depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

const Terrain = memo(function Terrain() {
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, 0]}>
        <circleGeometry args={[240, 64]} />
        <meshStandardMaterial color="#0b0c10" roughness={0.9} metalness={0.1} />
      </mesh>
      <Grid
        infiniteGrid
        followCamera
        cellSize={1.5}
        cellThickness={0.6}
        cellColor="#1a1633"
        sectionSize={9}
        sectionThickness={1.2}
        sectionColor="#5b4bc4"
        fadeDistance={110}
        fadeStrength={1.6}
      />
      {STATIONS.map((s) => (
        <GuideRoad key={s.id} to={s.position} color={s.color} />
      ))}
      {/* Spawn pad */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]}>
        <ringGeometry args={[2.6, 2.75, 48]} />
        <meshBasicMaterial color={ACID} transparent opacity={0.35} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
});

const ArenaBoundary = memo(function ArenaBoundary() {
  const wallRadius = ARENA_RADIUS + 2;
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]}>
        <ringGeometry args={[wallRadius - 0.2, wallRadius + 0.2, 128]} />
        <meshBasicMaterial color={ACID} transparent opacity={0.55} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[wallRadius, wallRadius, 2.4, 128, 1, true]} />
        <meshBasicMaterial
          color={ACID}
          transparent
          opacity={0.06}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
});

const SKYLINE_COUNT = 72;
const SKYLINE_COLORS = [ACID, "#38bdf8", "#c084fc", "#ff3b5c", "#f2f2f0"];

const Skyline = memo(function Skyline() {
  const towers = useRef<THREE.InstancedMesh>(null);
  const roofs = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const t = towers.current;
    const rf = roofs.current;
    if (!t || !rf) return;
    const rng = mulberry32(7);
    const m = new THREE.Object3D();
    const color = new THREE.Color();
    for (let i = 0; i < SKYLINE_COUNT; i++) {
      const a = (i / SKYLINE_COUNT) * Math.PI * 2 + rng() * 0.06;
      const r = 78 + rng() * 34;
      const w = 3 + rng() * 6;
      const d = 3 + rng() * 6;
      const h = 8 + rng() * 38;
      m.position.set(Math.cos(a) * r, h / 2, Math.sin(a) * r);
      m.rotation.set(0, rng() * Math.PI, 0);
      m.scale.set(w, h, d);
      m.updateMatrix();
      t.setMatrixAt(i, m.matrix);

      // Neon roof strip sits on top of each tower
      m.position.y = h + 0.15;
      m.scale.set(w * 1.02, 0.3, d * 1.02);
      m.updateMatrix();
      rf.setMatrixAt(i, m.matrix);
      rf.setColorAt(i, color.set(SKYLINE_COLORS[Math.floor(rng() * SKYLINE_COLORS.length)]));
    }
    t.instanceMatrix.needsUpdate = true;
    rf.instanceMatrix.needsUpdate = true;
    if (rf.instanceColor) rf.instanceColor.needsUpdate = true;
  }, []);

  return (
    <>
      {/* Towers and roofs skip fog so the silhouettes and neon trim read on the horizon */}
      <instancedMesh ref={towers} args={[undefined, undefined, SKYLINE_COUNT]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#0a0c14" metalness={0.5} roughness={0.6} emissive="#10152a" fog={false} />
      </instancedMesh>
      <instancedMesh ref={roofs} args={[undefined, undefined, SKYLINE_COUNT]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial toneMapped={false} fog={false} />
      </instancedMesh>
    </>
  );
});

/* ═══════════════════════════ WORLD DETAILS ═══════════════════════════ */

function useChevronGeometry() {
  const geometry = useMemo(() => {
    // A "V" whose apex points along the pad's driving direction once laid flat
    const s = new THREE.Shape();
    s.moveTo(-0.8, 0.25);
    s.lineTo(0, -0.35);
    s.lineTo(0.8, 0.25);
    s.lineTo(0.8, 0.55);
    s.lineTo(0, -0.05);
    s.lineTo(-0.8, 0.55);
    s.closePath();
    return new THREE.ShapeGeometry(s);
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return geometry;
}

const BoostPads = memo(function BoostPads() {
  const chevronGeometry = useChevronGeometry();
  const chevrons = useRef<(THREE.Mesh | null)[]>([]);
  const rings = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    chevrons.current.forEach((m, i) => {
      if (!m) return;
      const p = (t * 1.3 + (i % 3) / 3) % 1;
      m.position.z = -1.7 + p * 3.4;
      (m.material as THREE.MeshBasicMaterial).opacity = Math.sin(p * Math.PI) * 0.95;
    });
    rings.current.forEach((m, i) => {
      if (!m) return;
      const p = (t * 0.7 + i * 0.25) % 1;
      m.scale.setScalar(1 + p * 1.6);
      (m.material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.45;
    });
  });

  return (
    <>
      {BOOST_PADS.map((pad, pi) => (
        <group key={pi} position={pad.position} rotation-y={pad.heading}>
          <mesh rotation-x={-Math.PI / 2} position={[0, 0.025, 0]}>
            <planeGeometry args={[2.8, 4.2]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.12} depthWrite={false} toneMapped={false} />
          </mesh>
          {[-1.4, 1.4].map((x) => (
            <mesh key={x} rotation-x={-Math.PI / 2} position={[x, 0.03, 0]}>
              <planeGeometry args={[0.07, 4.2]} />
              <meshBasicMaterial color="#38bdf8" toneMapped={false} />
            </mesh>
          ))}
          {[0, 1, 2].map((k) => (
            <mesh
              key={k}
              ref={(m) => {
                chevrons.current[pi * 3 + k] = m;
              }}
              geometry={chevronGeometry}
              rotation-x={-Math.PI / 2}
              position={[0, 0.04, 0]}
            >
              <meshBasicMaterial
                color="#7dd3fc"
                transparent
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                side={THREE.DoubleSide}
                toneMapped={false}
              />
            </mesh>
          ))}
          <mesh
            ref={(m) => {
              rings.current[pi] = m;
            }}
            rotation-x={-Math.PI / 2}
            position={[0, 0.035, 0]}
          >
            <ringGeometry args={[2.3, 2.4, 48]} />
            <meshBasicMaterial color="#38bdf8" transparent depthWrite={false} toneMapped={false} />
          </mesh>
          <pointLight position={[0, 0.6, 0]} color="#38bdf8" intensity={5} distance={6} decay={2} />
        </group>
      ))}
    </>
  );
});

const CRYSTAL_COUNT = 22;

// Floating neon crystals scattered around the arena (clear of bays, orbs and pads)
const EnergyCrystals = memo(function EnergyCrystals() {
  const cores = useRef<THREE.InstancedMesh>(null);
  const shells = useRef<THREE.InstancedMesh>(null);

  const crystals = useMemo(() => {
    const rng = mulberry32(21);
    const avoid: Vec3[] = [
      ...STATIONS.map((s) => s.position),
      ...SKILL_ORBS.map((o) => o.position),
      ...BOOST_PADS.map((p) => p.position),
      [0, 0, 0],
    ];
    const list: { x: number; z: number; y: number; size: number; phase: number; color: string }[] = [];
    let guard = 0;
    while (list.length < CRYSTAL_COUNT && guard++ < 600) {
      const a = rng() * Math.PI * 2;
      const r = 14 + rng() * 40;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      if (avoid.some(([ax, , az]) => Math.hypot(ax - x, az - z) < 8)) continue;
      list.push({
        x,
        z,
        y: 1.6 + rng() * 2.4,
        size: 0.35 + rng() * 0.45,
        phase: rng() * Math.PI * 2,
        color: SKYLINE_COLORS[Math.floor(rng() * 4)],
      });
    }
    return list;
  }, []);

  useLayoutEffect(() => {
    const color = new THREE.Color();
    crystals.forEach((c, i) => {
      cores.current?.setColorAt(i, color.set(c.color));
      shells.current?.setColorAt(i, color.set(c.color));
    });
    if (cores.current?.instanceColor) cores.current.instanceColor.needsUpdate = true;
    if (shells.current?.instanceColor) shells.current.instanceColor.needsUpdate = true;
  }, [crystals]);

  const m = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    crystals.forEach((c, i) => {
      m.position.set(c.x, c.y + Math.sin(t * 1.3 + c.phase) * 0.35, c.z);
      m.rotation.set(0, t * 0.8 + c.phase, Math.sin(t * 0.6 + c.phase) * 0.2);
      m.scale.set(c.size * 0.6, c.size * 1.5, c.size * 0.6);
      m.updateMatrix();
      cores.current?.setMatrixAt(i, m.matrix);
      m.scale.multiplyScalar(1.45);
      m.rotation.y = -t * 0.5 + c.phase;
      m.updateMatrix();
      shells.current?.setMatrixAt(i, m.matrix);
    });
    if (cores.current) cores.current.instanceMatrix.needsUpdate = true;
    if (shells.current) shells.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <instancedMesh ref={cores} args={[undefined, undefined, crystals.length]}>
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial toneMapped={false} transparent opacity={0.92} />
      </instancedMesh>
      <instancedMesh ref={shells} args={[undefined, undefined, crystals.length]}>
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial toneMapped={false} wireframe transparent opacity={0.35} />
      </instancedMesh>
    </>
  );
});

// Meteors streaking across the sky every few seconds
const ShootingStars = memo(function ShootingStars() {
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  const meteors = useMemo(
    () =>
      Array.from({ length: 4 }, (_, i) => {
        const a = i * 1.9 + 0.4;
        const start = new THREE.Vector3(Math.cos(a) * 170, 95 + i * 8, Math.sin(a) * 170);
        const end = new THREE.Vector3(Math.cos(a + 1.1) * 120, 45 + i * 6, Math.sin(a + 1.1) * 120);
        const quaternion = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 0, 1),
          end.clone().sub(start).normalize()
        );
        return { start, end, quaternion, delay: i * 2.3, period: 7 + i * 1.7 };
      }),
    []
  );

  useFrame(({ clock }) => {
    meteors.forEach((meteor, i) => {
      const mesh = meshes.current[i];
      if (!mesh) return;
      const cycle = ((clock.elapsedTime + meteor.delay) % meteor.period) / meteor.period;
      const k = cycle / 0.16;
      mesh.visible = k <= 1;
      if (!mesh.visible) return;
      mesh.position.lerpVectors(meteor.start, meteor.end, k);
      (mesh.material as THREE.MeshBasicMaterial).opacity = Math.sin(k * Math.PI);
    });
  });

  return (
    <>
      {meteors.map((meteor, i) => (
        <mesh
          key={i}
          ref={(m) => {
            meshes.current[i] = m;
          }}
          quaternion={meteor.quaternion}
          visible={false}
        >
          <boxGeometry args={[0.35, 0.35, 22]} />
          <meshBasicMaterial color="#e9d5ff" transparent fog={false} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      ))}
    </>
  );
});

/* ═══════════════════════════ DOCKING STATIONS ═══════════════════════════ */

function SolarArray({ color }: { color: string }) {
  return (
    <group>
      <mesh>
        <octahedronGeometry args={[0.7, 0]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <group key={i} rotation-y={(i / 4) * Math.PI * 2}>
          <mesh position={[1.5, 0, 0]} rotation-z={Math.PI / 2}>
            <cylinderGeometry args={[0.05, 0.05, 2.2, 6]} />
            <meshStandardMaterial color="#2a2f36" metalness={0.6} roughness={0.4} />
          </mesh>
          <group position={[3.1, 0, 0]} rotation-z={-0.4}>
            <mesh>
              <boxGeometry args={[1.9, 0.06, 1.25]} />
              <meshStandardMaterial color="#0b1a3a" metalness={0.5} roughness={0.25} emissive="#0a1f4d" emissiveIntensity={0.6} />
            </mesh>
            <mesh>
              <boxGeometry args={[1.92, 0.07, 1.27, 5, 1, 3]} />
              <meshBasicMaterial color={color} wireframe transparent opacity={0.55} toneMapped={false} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}

function MedicalBeacon({ color, accent }: { color: string; accent: string }) {
  const heart = useRef<THREE.Group>(null);
  const time = useRef(0);

  useFrame((_, dt) => {
    time.current += dt;
    if (!heart.current) return;
    // Double-thump heartbeat
    const beat = time.current % 1.2;
    const thump =
      Math.exp(-((beat - 0.1) ** 2) / 0.002) + 0.6 * Math.exp(-((beat - 0.32) ** 2) / 0.002);
    heart.current.scale.setScalar(1 + thump * 0.3);
  });

  return (
    <group>
      <group ref={heart}>
        <mesh>
          <boxGeometry args={[2.2, 0.7, 0.5]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.7, 2.2, 0.5]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
      </group>
      <mesh rotation-x={Math.PI / 2}>
        <torusGeometry args={[2.1, 0.05, 8, 64]} />
        <meshBasicMaterial color={accent} toneMapped={false} />
      </mesh>
      <mesh rotation-x={Math.PI / 3}>
        <torusGeometry args={[2.5, 0.03, 8, 64]} />
        <meshBasicMaterial color={accent} transparent opacity={0.6} toneMapped={false} />
      </mesh>
    </group>
  );
}

function RadarDish({ color }: { color: string }) {
  return (
    <group rotation-x={-0.6}>
      {/* Spherical cap flipped so the bowl opens upward; feed horn sits at the focus */}
      <mesh position={[0, 1.6, 0]} rotation-x={Math.PI}>
        <sphereGeometry args={[1.9, 32, 12, 0, Math.PI * 2, 0, 0.85]} />
        <meshStandardMaterial
          color="#1a1426"
          metalness={0.6}
          roughness={0.35}
          side={THREE.DoubleSide}
          emissive={color}
          emissiveIntensity={0.08}
        />
      </mesh>
      <mesh position={[0, 1.6, 0]} rotation-x={Math.PI}>
        <sphereGeometry args={[1.92, 16, 6, 0, Math.PI * 2, 0, 0.85]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.45} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.175, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.95, 6]} />
        <meshStandardMaterial color="#3b3350" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.65, 0]}>
        <sphereGeometry args={[0.16, 12, 12]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
    </group>
  );
}

function RisingParticles({ color, count = 80, radius = 0.9, height = 18 }: {
  color: string;
  count?: number;
  radius?: number;
  height?: number;
}) {
  const { geometry, speeds } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const rr = Math.sqrt(Math.random()) * radius;
      pos[i * 3] = Math.cos(a) * rr;
      pos[i * 3 + 1] = Math.random() * height;
      pos[i * 3 + 2] = Math.sin(a) * rr;
      spd[i] = 1.5 + Math.random() * 3;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return { geometry: geo, speeds: spd };
  }, [count, radius, height]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((_, dt) => {
    const attr = geometry.getAttribute("position") as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const yi = i * 3 + 1;
      arr[yi] += speeds[i] * dt;
      if (arr[yi] > height) arr[yi] = 0;
    }
    attr.needsUpdate = true;
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        color={color}
        size={0.16}
        transparent
        opacity={0.85}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </points>
  );
}

const DockingStation = memo(function DockingStation({
  station,
  active,
  docked,
}: {
  station: Station;
  active: boolean;
  docked: boolean;
}) {
  const spinner = useRef<THREE.Group>(null);
  const zoneMat = useRef<THREE.MeshBasicMaterial>(null);
  const beamMat = useRef<THREE.MeshBasicMaterial>(null);
  const time = useRef(station.position[0]);

  useFrame((_, dt) => {
    time.current += dt;
    const t = time.current;
    if (spinner.current) spinner.current.rotation.y += dt * (station.kind === "radar" ? 0.9 : 0.35);
    if (zoneMat.current) zoneMat.current.opacity = (active ? 0.75 : 0.28) + Math.sin(t * (active ? 6 : 2.2)) * 0.12;
    if (beamMat.current) beamMat.current.opacity = 0.09 + Math.sin(t * 1.6) * 0.03 + (active ? 0.08 : 0);
  });

  const [x, , z] = station.position;
  return (
    <group position={[x, 0, z]}>
      {/* Hex landing pad the rover climbs onto */}
      <mesh position={[0, PAD_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[PAD_RADIUS, PAD_RADIUS + 0.35, PAD_HEIGHT, 6]} />
        <meshStandardMaterial color="#0d0e12" metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[0, PAD_HEIGHT + 0.01, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[PAD_RADIUS - 0.2, PAD_RADIUS - 0.06, 6]} />
        <meshBasicMaterial color={station.color} toneMapped={false} />
      </mesh>
      <mesh position={[0, PAD_HEIGHT + 0.012, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[1.5, 1.62, 40]} />
        <meshBasicMaterial color={station.color} transparent opacity={0.6} toneMapped={false} />
      </mesh>
      {/* Pulsing docking zone */}
      <mesh position={[0, 0.03, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[DOCK_RADIUS + 0.4, DOCK_RADIUS + 0.7, 64]} />
        <meshBasicMaterial ref={zoneMat} color={station.color} transparent opacity={0.3} depthWrite={false} toneMapped={false} />
      </mesh>
      {/* Beacon beam, visible from anywhere on the map */}
      <mesh position={[0, 20, 0]}>
        <cylinderGeometry args={[0.55, 0.9, 40, 16, 1, true]} />
        <meshBasicMaterial
          ref={beamMat}
          color={station.accent}
          transparent
          opacity={0.1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
      <pointLight position={[0, 3, 0]} color={station.color} intensity={active ? 40 : 22} distance={16} decay={1.6} />

      <group ref={spinner} position={[0, 4.2, 0]}>
        {station.kind === "solar" && <SolarArray color={station.color} />}
        {station.kind === "medical" && <MedicalBeacon color={station.color} accent={station.accent} />}
        {station.kind === "radar" && <RadarDish color={station.color} />}
      </group>
      {station.kind === "radar" && <RisingParticles color={station.color} />}

      <Suspense fallback={null}>
        <Billboard position={[0, 8.4, 0]}>
          <Text fontSize={0.7} color={station.color} anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="#000000">
            {station.label}
          </Text>
          <Text position={[0, -0.75, 0]} fontSize={0.34} color={docked ? station.color : "#a3a3a3"} anchorX="center" anchorY="middle">
            {docked ? "BAY SYNCED" : "DRIVE IN TO DOCK // +200 XP"}
          </Text>
        </Billboard>
      </Suspense>
    </group>
  );
});

/* ═══════════════════════════ SKILL ORBS ═══════════════════════════ */

const SkillOrb = memo(function SkillOrb({ orb, index }: { orb: SkillOrbDef; index: number }) {
  const bob = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const shell = useRef<THREE.Mesh>(null);
  const time = useRef(index * 1.3);

  useFrame((_, dt) => {
    time.current += dt;
    if (bob.current) bob.current.position.y = 1.6 + Math.sin(time.current * 2) * 0.25;
    if (core.current) {
      core.current.rotation.y += dt * 1.4;
      core.current.rotation.x += dt * 0.6;
    }
    if (shell.current) {
      shell.current.rotation.y -= dt * 0.8;
      shell.current.rotation.z += dt * 0.4;
    }
  });

  const [x, , z] = orb.position;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.03, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.9, 1.05, 32]} />
        <meshBasicMaterial color={orb.color} transparent opacity={0.45} depthWrite={false} toneMapped={false} />
      </mesh>
      <group ref={bob} position={[0, 1.6, 0]}>
        <mesh ref={core}>
          <octahedronGeometry args={[0.55, 0]} />
          <meshBasicMaterial color={orb.color} toneMapped={false} />
        </mesh>
        <mesh ref={shell}>
          <icosahedronGeometry args={[0.95, 0]} />
          <meshBasicMaterial color={orb.color} wireframe transparent opacity={0.55} toneMapped={false} />
        </mesh>
        <mesh>
          <sphereGeometry args={[1.25, 16, 16]} />
          <meshBasicMaterial
            color={orb.color}
            transparent
            opacity={0.08}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        <Suspense fallback={null}>
          <Billboard position={[0, 1.55, 0]}>
            <Text fontSize={0.42} color={orb.color} anchorX="center" anchorY="middle" outlineWidth={0.015} outlineColor="#000000">
              {orb.label}
            </Text>
          </Billboard>
        </Suspense>
      </group>
    </group>
  );
});

function Burst({ position, color }: { position: Vec3; color: string }) {
  const points = useRef<THREE.Points>(null);
  const ring = useRef<THREE.Mesh>(null);
  const age = useRef(0);

  const { geometry, velocities } = useMemo(() => {
    const count = 48;
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = 3 + Math.random() * 5;
      vel[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
      vel[i * 3 + 1] = Math.abs(Math.cos(phi)) * speed * 0.9 + 1;
      vel[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * speed;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    return { geometry: geo, velocities: vel };
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((_, dt) => {
    age.current += dt;
    const a = age.current;
    const attr = geometry.getAttribute("position") as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < arr.length; i += 3) {
      arr[i] = velocities[i] * a;
      arr[i + 1] = velocities[i + 1] * a - 4.5 * a * a;
      arr[i + 2] = velocities[i + 2] * a;
    }
    attr.needsUpdate = true;

    const fade = Math.max(0, 1 - a / BURST_LIFETIME);
    const pm = points.current?.material as THREE.PointsMaterial | undefined;
    if (pm) pm.opacity = fade;
    if (ring.current) {
      ring.current.scale.setScalar(1 + a * 7);
      (ring.current.material as THREE.MeshBasicMaterial).opacity = fade * 0.8;
    }
  });

  return (
    <group position={[position[0], 1.6, position[2]]}>
      <points ref={points} geometry={geometry} frustumCulled={false}>
        <pointsMaterial
          color={color}
          size={0.22}
          transparent
          opacity={1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </points>
      <mesh ref={ring} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.4, 0.55, 40]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ═══════════════════════════ GAME SHELL + HUD ═══════════════════════════ */

export default function CyberRoverGame() {
  const { setGameMode, openProjectModal, completeQuest, addXp, activeProjectModal, quests } = useGame();

  const [initialOrbs] = useState(() => loadIndexList(STORAGE_ORBS, SKILL_ORBS.length));
  const [initialDocks] = useState(() => loadIndexList(STORAGE_DOCKS, STATIONS.length));
  const [collected, setCollected] = useState<number[]>(initialOrbs);
  const [docked, setDocked] = useState<number[]>(initialDocks);
  const [nearStation, setNearStation] = useState<number | null>(null);
  const [bursts, setBursts] = useState<BurstData[]>([]);
  const [showBriefing, setShowBriefing] = useState(true);

  // Refs shared with the render loop (no React re-render per frame)
  const controlsRef = useRef<ControlState>(emptyControls());
  const pausedRef = useRef(false);
  const collectedRef = useRef<Set<number>>(new Set(initialOrbs));
  const dockedRef = useRef<Set<number>>(new Set(initialDocks));
  const nearStationRef = useRef<number | null>(null);
  const burstIdRef = useRef(0);
  const questsRef = useRef(quests);

  const speedRef = useRef<HTMLSpanElement>(null);
  const speedBarRef = useRef<HTMLDivElement>(null);
  const gearRef = useRef<HTMLSpanElement>(null);
  const headingRef = useRef<HTMLSpanElement>(null);
  const compassTapeRef = useRef<HTMLDivElement>(null);
  const hud = useMemo<HudRefs>(
    () => ({
      speed: speedRef,
      speedBar: speedBarRef,
      gear: gearRef,
      heading: headingRef,
      compassTape: compassTapeRef,
    }),
    []
  );

  useEffect(() => {
    questsRef.current = quests;
  }, [quests]);

  // Freeze the rover while a docking terminal (project modal) is open
  useEffect(() => {
    pausedRef.current = activeProjectModal !== null;
    if (activeProjectModal) controlsRef.current = emptyControls();
  }, [activeProjectModal]);

  const handleCollect = useCallback(
    (index: number) => {
      const orb = SKILL_ORBS[index];
      const list = Array.from(collectedRef.current);
      setCollected(list);
      saveIndexList(STORAGE_ORBS, list);

      const id = ++burstIdRef.current;
      setBursts((b) => [...b, { id, position: orb.position, color: orb.color }]);
      window.setTimeout(() => setBursts((b) => b.filter((x) => x.id !== id)), BURST_LIFETIME * 1000 + 150);

      sound.playCollect();
      // Let the crystal chime ring out before the XP arpeggio
      window.setTimeout(() => {
        addXp(50, `SKILL ACQUIRED: ${orb.label}`);
        if (collectedRef.current.size >= 3) completeQuest("collect_skills");
      }, 260);
    },
    [addXp, completeQuest]
  );

  const handleNearStation = useCallback((index: number | null) => {
    nearStationRef.current = index;
    setNearStation(index);
    if (index !== null) sound.playBlip(520, 0.08);
  }, []);

  const callbacksRef = useRef<WorldCallbacks>({ onCollect: handleCollect, onNearStation: handleNearStation });
  useLayoutEffect(() => {
    callbacksRef.current = { onCollect: handleCollect, onNearStation: handleNearStation };
  }, [handleCollect, handleNearStation]);

  // Every bay awards +200 XP the first time it is docked (the first one via the quest)
  const dock = useCallback(
    (index: number) => {
      if (pausedRef.current) return;
      const station = STATIONS[index];
      const project = projects.find((p) => p.slug === station.projectSlug);
      if (project) openProjectModal(project);
      if (dockedRef.current.has(index)) return;

      dockedRef.current.add(index);
      const list = Array.from(dockedRef.current);
      setDocked(list);
      saveIndexList(STORAGE_DOCKS, list);

      const questDone = questsRef.current.some((q) => q.id === "dock_station" && q.completed);
      if (!questDone) completeQuest("dock_station");
      else addXp(200, `BAY SYNCED: ${station.label}`);
    },
    [openProjectModal, completeQuest, addXp]
  );
  const dockRef = useRef(dock);
  useLayoutEffect(() => {
    dockRef.current = dock;
  }, [dock]);

  // Lock page scroll, drop focus from the launch button, auto-hide briefing
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    const timer = window.setTimeout(() => setShowBriefing(false), 7000);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(timer);
    };
  }, []);

  // Keyboard driving
  useEffect(() => {
    const isTyping = (t: EventTarget | null) =>
      t instanceof HTMLElement && !!t.closest("input, textarea, select, [contenteditable='true']");

    const onDown = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;
      const action = KEY_MAP[e.code];
      if (action) {
        e.preventDefault();
        // A focused HUD button would otherwise be "clicked" by Space
        if (e.target instanceof HTMLButtonElement) e.target.blur();
        if (pausedRef.current) return;
        if (action === "forward" && !controlsRef.current.forward) sound.playEngineAccelerate();
        controlsRef.current[action] = true;
        setShowBriefing(false);
        return;
      }
      if (e.code === "KeyE" && !e.repeat && nearStationRef.current !== null) {
        e.preventDefault();
        dockRef.current(nearStationRef.current);
      }
    };
    const onUp = (e: KeyboardEvent) => {
      const action = KEY_MAP[e.code];
      if (action) {
        e.preventDefault();
        controlsRef.current[action] = false;
      }
    };
    const releaseAll = () => {
      controlsRef.current = emptyControls();
    };

    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", releaseAll);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", releaseAll);
    };
  }, []);

  // Virtual D-pad bindings for touch devices
  const bindTouch = (action: keyof ControlState) => {
    const release = () => {
      controlsRef.current[action] = false;
    };
    return {
      onPointerDown: (e: ReactPointerEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (pausedRef.current) return;
        if (action === "forward" && !controlsRef.current.forward) sound.playEngineAccelerate();
        controlsRef.current[action] = true;
        setShowBriefing(false);
      },
      onPointerUp: release,
      onPointerCancel: release,
      onPointerLeave: release,
      onContextMenu: (e: ReactMouseEvent) => e.preventDefault(),
    };
  };

  return (
    <div className="fixed inset-0 z-0 bg-[#030305] select-none">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 16, -22], fov: BASE_FOV, near: 0.1, far: 420 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <color attach="background" args={["#04030d"]} />
        <fog attach="fog" args={["#070518", 40, 150]} />
        <hemisphereLight args={["#7c89ff", "#0a0a0a", 0.9]} />
        <directionalLight position={[30, 40, 10]} intensity={0.9} color="#c7d0ff" />
        <Stars radius={180} depth={60} count={2500} factor={5} saturation={0} fade speed={0.5} />

        <Terrain />
        <ArenaBoundary />
        <Skyline />
        <BoostPads />
        <EnergyCrystals />
        <ShootingStars />

        {STATIONS.map((s, i) => (
          <DockingStation key={s.id} station={s} active={nearStation === i} docked={docked.includes(i)} />
        ))}
        {SKILL_ORBS.map((o, i) => (collected.includes(i) ? null : <SkillOrb key={o.id} orb={o} index={i} />))}
        {bursts.map((b) => (
          <Burst key={b.id} position={b.position} color={b.color} />
        ))}

        <Rover
          controlsRef={controlsRef}
          pausedRef={pausedRef}
          collectedRef={collectedRef}
          callbacksRef={callbacksRef}
          hud={hud}
        />
      </Canvas>

      {/* ── Mission status (top-left) ── */}
      <div className="game-panel absolute z-[60] left-3 md:left-6 top-[112px] md:top-[124px] lg:top-20 px-4 py-3 w-[180px] md:w-[220px]">
        <div className="mono text-[10px] text-[var(--acid)] tracking-widest mb-2 flex items-center gap-2">
          <Crosshair size={12} /> SECTOR 07
        </div>
        <div className="flex justify-between mono text-[11px]">
          <span className="text-neutral-400">SKILL ORBS</span>
          <span className="text-white">
            {collected.length}/{SKILL_ORBS.length}
          </span>
        </div>
        <div className="flex gap-1.5 my-2">
          {SKILL_ORBS.map((o, i) => (
            <span
              key={o.id}
              title={o.label}
              className="w-2.5 h-2.5 rotate-45 border"
              style={{
                borderColor: o.color,
                background: collected.includes(i) ? o.color : "transparent",
                boxShadow: collected.includes(i) ? `0 0 8px ${o.color}` : "none",
              }}
            />
          ))}
        </div>
        <div className="flex justify-between mono text-[11px]">
          <span className="text-neutral-400">BAYS SYNCED</span>
          <span className="text-white">
            {docked.length}/{STATIONS.length}
          </span>
        </div>
      </div>

      {/* ── Compass (top-center) ── */}
      <div className="game-panel compass absolute z-[60] left-1/2 -translate-x-1/2 top-[60px] md:top-[68px] lg:top-20 w-[200px] md:w-[300px]">
        <div
          ref={compassTapeRef}
          className="compass-tape"
          style={{ transform: `translateX(${-360 * COMPASS_PX_PER_DEG}px)` }}
        >
          {COMPASS_MARKS.map((m) => (
            <div key={m.deg}>
              <span
                className={`compass-tick ${m.major ? "compass-tick--major" : ""}`}
                style={{ left: m.deg * COMPASS_PX_PER_DEG }}
              />
              {m.label && (
                <span
                  className={`compass-label mono ${m.cardinal ? "compass-label--cardinal" : ""}`}
                  style={{ left: m.deg * COMPASS_PX_PER_DEG }}
                >
                  {m.label}
                </span>
              )}
            </div>
          ))}
        </div>
        <span className="compass-needle" />
        <span
          ref={headingRef}
          className="absolute bottom-1 left-1/2 -translate-x-1/2 mono text-[10px] text-white tracking-widest"
        >
          000°
        </span>
      </div>

      {/* ── Exit (top-right) ── */}
      <button
        type="button"
        onClick={() => setGameMode("web")}
        className="game-exit-btn mono absolute z-[60] right-3 md:right-6 top-[60px] md:top-[68px] lg:top-20"
        aria-label="Exit to web view"
      >
        <LogOut size={14} />
        <span className="hidden sm:inline">EXIT TO WEB VIEW</span>
      </button>

      {/* ── Speedometer ── */}
      <div className="game-panel game-speedo">
        <div className="flex items-center justify-between mono text-[10px] text-neutral-400 tracking-widest mb-1">
          <span>VELOCITY</span>
          <span ref={gearRef} className="text-[var(--acid)] font-bold">
            N
          </span>
        </div>
        <div className="flex items-end gap-2">
          <span ref={speedRef} className="display text-4xl md:text-5xl text-white tabular-nums leading-none">
            000
          </span>
          <span className="mono text-[10px] text-neutral-400 mb-1">KM/H</span>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            ref={speedBarRef}
            className="h-full rounded-full bg-[var(--acid)] shadow-[0_0_10px_var(--acid)]"
            style={{ width: "0%" }}
          />
        </div>
      </div>

      {/* ── Docking prompt ── */}
      {nearStation !== null && !activeProjectModal && (
        <button type="button" className="game-dock-prompt mono" onClick={() => dock(nearStation)}>
          <span className="text-[10px] text-neutral-300 font-normal tracking-widest">
            {STATIONS[nearStation].label} // IN RANGE
          </span>
          <span>[ PRESS E OR TAP TO ACCESS DOCKING TERMINAL ]</span>
        </button>
      )}

      {/* ── Controls reference (keyboard devices) ── */}
      <div className="pointer-only game-panel game-hint mono text-[10px] text-neutral-400 tracking-wider">
        <span className="game-kbd">WASD</span>/<span className="game-kbd">ARROWS</span> DRIVE ·{" "}
        <span className="game-kbd">SPACE</span> BRAKE · <span className="game-kbd">E</span> INTERACT
      </div>

      {/* ── Virtual D-pad (touch devices) ── */}
      <div className="touch-only absolute z-[65] left-4 bottom-5 gap-3">
        <button type="button" className="touch-pad-btn" aria-label="Steer left" {...bindTouch("left")}>
          <ChevronLeft size={28} />
        </button>
        <button type="button" className="touch-pad-btn" aria-label="Steer right" {...bindTouch("right")}>
          <ChevronRight size={28} />
        </button>
      </div>
      <div className="touch-only absolute z-[65] right-4 bottom-5 gap-3 items-end">
        <button type="button" className="touch-pad-btn touch-pad-btn--brake" aria-label="Brake" {...bindTouch("brake")}>
          BRAKE
        </button>
        <div className="flex flex-col gap-3">
          <button type="button" className="touch-pad-btn" aria-label="Accelerate" {...bindTouch("forward")}>
            <ChevronUp size={28} />
          </button>
          <button type="button" className="touch-pad-btn" aria-label="Reverse" {...bindTouch("back")}>
            <ChevronDown size={28} />
          </button>
        </div>
      </div>

      {/* ── Mission briefing ── */}
      {showBriefing && (
        <div className="absolute inset-0 z-[80] flex items-center justify-center px-4 pointer-events-none">
          <div className="game-panel pointer-events-auto max-w-md w-full p-6 md:p-7">
            <div className="mono text-[10px] text-[var(--acid)] tracking-[.3em] mb-3 text-center">
              MISSION BRIEFING
            </div>
            <h2 className="display text-4xl md:text-5xl uppercase mb-5 text-center">CYBER-ROVER ONLINE</h2>
            <ul className="text-sm text-neutral-300 space-y-2 mb-6">
              <li>
                <span className="text-[var(--acid)]">▹</span> Drive into the{" "}
                <span className="text-white">3 docking bays</span> to open project terminals.
              </li>
              <li>
                <span className="text-[var(--acid)]">▹</span> Collect the{" "}
                <span className="text-[var(--acid)]">6 floating skill orbs</span> for XP.
              </li>
              <li>
                <span className="text-[var(--acid)]">▹</span> Hit the glowing{" "}
                <span className="text-sky-300">boost pads</span> for a burst of speed.
              </li>
              <li>
                <span className="text-[var(--acid)]">▹</span> Follow the light beams on the horizon.
              </li>
            </ul>
            <div className="flex justify-center">
              <button type="button" onClick={() => setShowBriefing(false)} className="hud-launch-btn mono">
                ENGAGE THRUSTERS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
