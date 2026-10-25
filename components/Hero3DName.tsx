"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { buildNameLetters, NAME_FONT_URL } from "./three/nameLetters";
import { useInView } from "../utils/useInView";

/* The hero name as real extruded 3D letters in brushed silver: they fly in one by
   one, a flip wave runs through them every few seconds, and the word tilts toward
   the pointer. The canvas bleeds past the DOM heading so tilted letters never clip. */

const WAVE_PERIOD = 7;
// A distant, narrow camera keeps the framing but barely enlarges letters that swing toward it
const CAM_Z = 30;
const CAM_FOV = 11;
const MAX_TILT_Y = 0.08;
const LETTER_DEPTH = 0.34;
const FLIP_TIME = 0.95;

const easeOutBack = (t: number) => 1 + 2.5 * Math.pow(t - 1, 3) + 1.5 * Math.pow(t - 1, 2);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function StudioReflections() {
  const { gl, scene } = useThree();
  useEffect(() => {
    let env: THREE.Texture | null = null;
    const build = () => {
      const pmrem = new THREE.PMREMGenerator(gl);
      const room = new RoomEnvironment();
      env = pmrem.fromScene(room, 0.04).texture;
      scene.environment = env;
      room.dispose();
      pmrem.dispose();
    };
    // Off the critical path: the letters it lights up are seconds away
    const idle = window.requestIdleCallback?.(build, { timeout: 1200 }) ?? window.setTimeout(build, 300);
    return () => {
      window.cancelIdleCallback?.(idle);
      window.clearTimeout(idle);
      scene.environment = null;
      env?.dispose();
    };
  }, [gl, scene]);
  return null;
}

function Letters({
  lines,
  bleedX,
  bleedY,
  onReady,
  pointer,
}: {
  lines: string[];
  bleedX: number;
  bleedY: number;
  onReady?: () => void;
  pointer: React.RefObject<{ x: number; y: number }>;
}) {
  const font = useLoader(FontLoader, NAME_FONT_URL);
  const { letters, lineWidths, capHeight } = useMemo(() => buildNameLetters(font, lines), [font, lines]);
  const { viewport } = useThree();

  const group = useRef<THREE.Group>(null);
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  const shine = useRef<THREE.PointLight>(null);
  // Own timeline rather than the canvas clock, which restarts whenever the loop is paused off-screen
  const elapsed = useRef(0);

  const materials = useMemo(
    () => [
      new THREE.MeshStandardMaterial({ color: "#f2f2f4", metalness: 0.8, roughness: 0.24, envMapIntensity: 0.9 }),
      new THREE.MeshStandardMaterial({ color: "#b9b4d6", metalness: 0.75, roughness: 0.28, envMapIntensity: 0.8 }),
    ],
    []
  );

  // Dispose only when the geometry itself changes, never because a parent re-rendered
  useEffect(
    () => () => {
      letters.forEach((l) => l.geometry.dispose());
      materials.forEach((m) => m.dispose());
    },
    [letters, materials]
  );

  const readyRef = useRef(onReady);
  readyRef.current = onReady;
  useEffect(() => {
    readyRef.current?.();
  }, []);

  const lineGap = 0.26;
  const blockWidth = Math.max(...lineWidths);
  const blockHeight = capHeight * lines.length + lineGap * (lines.length - 1);
  // The DOM heading occupies the middle 1/(1+2·bleed) of the canvas in each direction
  const flatFit = Math.min(
    ((viewport.width / (1 + 2 * bleedX)) * 0.94) / blockWidth,
    ((viewport.height / (1 + 2 * bleedY)) * 0.98) / blockHeight
  );
  // Front faces sit nearer the camera than the z=0 plane the viewport is measured at
  const perspective = (CAM_Z - (LETTER_DEPTH / 2) * flatFit) / CAM_Z;
  const fit = flatFit * perspective;
  // Off-centre text is pushed outward by perspective too, so pull its anchor toward the centre
  const left = (-viewport.width / 2 + viewport.width * (bleedX / (1 + 2 * bleedX))) * perspective;
  const pivotX = left + (blockWidth * fit) / 2;
  const lineY = lines.map((_, i) => blockHeight / 2 - capHeight - i * (capHeight + lineGap));

  useFrame((_, delta) => {
    elapsed.current += Math.min(delta, 0.1);
    const t = elapsed.current;

    letters.forEach((letter, i) => {
      const mesh = meshes.current[i];
      if (!mesh) return;
      const enter = THREE.MathUtils.clamp((t - letter.order * 0.08) / 1.15, 0, 1);
      const e = easeOutBack(enter);
      let y = lineY[letter.line] + (1 - e) * -1.2;
      let rotY = 0;

      const waveT = t - 2.2 - letter.order * 0.09;
      if (waveT > 0) {
        const local = waveT % WAVE_PERIOD;
        if (local < FLIP_TIME) {
          const k = local / FLIP_TIME;
          rotY = easeInOut(k) * Math.PI * 2;
          y += Math.sin(Math.PI * k) * 0.22;
        }
      }

      mesh.position.set(letter.x, y, (1 - e) * -9);
      mesh.rotation.set((1 - e) * -1.5, rotY, 0);
      mesh.scale.setScalar(Math.max(0.001, enter));
    });

    if (group.current) {
      const p = pointer.current;
      group.current.rotation.y += (p.x * MAX_TILT_Y - group.current.rotation.y) * 0.06;
      group.current.rotation.x += (-p.y * 0.1 - group.current.rotation.x) * 0.06;
      group.current.position.set(pivotX, Math.sin(t * 0.8) * 0.03, 0);
    }
    if (shine.current) {
      const sweep = ((t * 0.3) % 1) * 2 - 0.5;
      shine.current.position.set(left + sweep * blockWidth * fit, 0.3, 2.6);
    }
  });

  return (
    <>
      <pointLight ref={shine} intensity={30} distance={10} color="#ffffff" />
      <group ref={group} position={[pivotX, 0, 0]}>
        <group position={[left - pivotX, 0, 0]} scale={fit}>
          {letters.map((letter, i) => (
            <mesh
              key={letter.order}
              ref={(m) => {
                meshes.current[i] = m;
              }}
              geometry={letter.geometry}
              material={materials[letter.line % materials.length]}
              scale={0.001}
            />
          ))}
        </group>
      </group>
    </>
  );
}

export default function Hero3DName({
  lines = ["SHIHAP"],
  bleedX = 0.07,
  bleedY = 0.18,
  onReady,
}: {
  lines?: string[];
  bleedX?: number;
  bleedY?: number;
  onReady?: () => void;
}) {
  const pointer = useRef({ x: 0, y: 0 });
  const [wrap, inView] = useInView<HTMLDivElement>();
  const stableLines = useMemo(() => lines, [lines.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps

  // The canvas doesn't take pointer events (content sits over it), so track the window
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <div ref={wrap} className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, CAM_Z], fov: CAM_FOV }}
        dpr={[1, 1.5]}
        frameloop={inView ? "always" : "never"}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent", pointerEvents: "none" }}
        fallback={null}
      >
        <StudioReflections />
        <ambientLight intensity={0.35} />
        <directionalLight position={[-4, 5, 6]} intensity={1.4} color="#ffffff" />
        <pointLight position={[-6, 1.5, -3]} intensity={38} distance={20} color="#a78bfa" />
        <pointLight position={[6, -1.5, -3]} intensity={26} distance={20} color="#e5e5ea" />
        <Suspense fallback={null}>
          <Letters lines={stableLines} bleedX={bleedX} bleedY={bleedY} onReady={onReady} pointer={pointer} />
        </Suspense>
      </Canvas>
    </div>
  );
}
