"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { GalaxyDisc, Starfield } from "./three/CosmicScene";
import { buildNameLetters, NAME_FONT_URL } from "./three/nameLetters";
import { getLenis } from "../utils/scroll";
import { clearIntroCover } from "../utils/intro";

/* ───────────────────────── Cinematic intro ─────────────────────────
   Dark screen → stars → a galaxy forms → the camera travels through the particle
   field → scattered letters assemble into a massive 3D SHIHAP → the camera zooms
   into the typography → the portfolio. One GSAP timeline drives a single progress
   value that every layer reads. */

const DURATION = 8.5;
const NAME_Z = -38;

const CAM_KEYS: [number, number][] = [
  [0.0, 22],
  [0.18, 19],
  [0.34, 12],
  [0.5, -2],
  [0.62, -13],
  [0.78, -19],
  [0.9, -26],
  [1.0, -31],
];

const PHASES: [number, string][] = [
  [0.0, "BOOTING"],
  [0.08, "DEEP FIELD"],
  [0.2, "GALAXY FORMING"],
  [0.38, "TRAVERSING"],
  [0.52, "ASSEMBLING"],
  [0.74, "SHIHAP"],
  [0.9, "WELCOME"],
];

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

function camZ(p: number) {
  for (let i = 0; i < CAM_KEYS.length - 1; i++) {
    const [p0, z0] = CAM_KEYS[i];
    const [p1, z1] = CAM_KEYS[i + 1];
    if (p <= p1) return lerp(z0, z1, smooth(seg(p, p0, p1)));
  }
  return CAM_KEYS[CAM_KEYS.length - 1][1];
}

type NumRef = React.RefObject<number>;

/* Everything expensive happens here, while the screen is still dark: the reflection
   probe the silver letters need, then shader compiling and program linking — together a
   few hundred milliseconds, enough to stall the opening if they ran inside it. It reports
   back so the timeline only starts on a warm scene. */
function Warmup({ onReady }: { onReady: () => void }) {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    let done = false;
    const ready = () => {
      if (done) return;
      done = true;
      onReady();
    };

    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const env = pmrem.fromScene(room, 0.04).texture;
    scene.environment = env;
    room.dispose();
    pmrem.dispose();

    const compiling = gl.compileAsync?.(scene, camera);
    if (compiling) compiling.then(ready, ready);
    else {
      gl.compile(scene, camera);
      ready();
    }
    // Never hold the opening hostage if compiling stalls
    const safety = window.setTimeout(ready, 2500);
    return () => {
      window.clearTimeout(safety);
      scene.environment = null;
      env.dispose();
    };
  }, [gl, scene, camera, onReady]);
  return null;
}

function TiltGroup({ tilt, children, ...props }: { tilt: NumRef; children: React.ReactNode } & Record<string, unknown>) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (ref.current) ref.current.rotation.x = tilt.current;
  });
  return (
    <group ref={ref} {...props}>
      {children}
    </group>
  );
}

function FollowCamera({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  const { camera } = useThree();
  useFrame(() => {
    if (ref.current) ref.current.position.z = camera.position.z;
  });
  return <group ref={ref}>{children}</group>;
}

/** Letters start scattered through the field and fly together into SHIHAP */
function AssemblingName({ progress }: { progress: NumRef }) {
  const font = useLoader(FontLoader, NAME_FONT_URL);
  const { letters, lineWidths, capHeight } = useMemo(() => buildNameLetters(font, ["SHIHAP"]), [font]);
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#f1f1f4", metalness: 0.85, roughness: 0.22, envMapIntensity: 1 }),
    []
  );
  useEffect(
    () => () => {
      letters.forEach((l) => l.geometry.dispose());
      material.dispose();
    },
    [letters, material]
  );

  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  const width = lineWidths[0];
  const scatter = useMemo(
    () =>
      letters.map((_, i) => {
        const a = (i / letters.length) * Math.PI * 2 + 0.6;
        return {
          x: Math.cos(a) * (9 + (i % 3) * 3),
          y: Math.sin(a) * (6 + (i % 2) * 3),
          z: -10 - i * 2.5,
          rx: (i % 2 ? 1 : -1) * 2.4,
          ry: (i % 3) - 1.2,
        };
      }),
    [letters]
  );

  useFrame(({ clock }) => {
    const p = progress.current;
    const scale = 16 / width;
    letters.forEach((letter, i) => {
      const mesh = meshes.current[i];
      if (!mesh) return;
      const k = easeOutCubic(seg(p, 0.5 + i * 0.03, 0.72 + i * 0.012));
      const s = scatter[i];
      const restX = (letter.x - width / 2) * scale;
      const restY = -capHeight * scale * 0.5;
      mesh.position.set(lerp(s.x, restX, k), lerp(s.y, restY, k), lerp(s.z, 0, k));
      mesh.rotation.set(lerp(s.rx, 0, k), lerp(s.ry, 0, k) + Math.sin(clock.elapsedTime * 0.8 + i) * 0.04 * k, 0);
      mesh.scale.setScalar(scale * lerp(0.35, 1, k));
      mesh.visible = p > 0.44;
    });
  });

  return (
    <group position={[0, 0, NAME_Z]}>
      {letters.map((letter, i) => (
        <mesh
          key={letter.order}
          ref={(m) => {
            meshes.current[i] = m;
          }}
          geometry={letter.geometry}
          material={material}
          visible={false}
        />
      ))}
    </group>
  );
}

function IntroRig({
  progress,
  starOpacity,
  starSpeed,
  galaxyOpacity,
  galaxyScale,
  galaxyTilt,
}: {
  progress: NumRef;
  starOpacity: NumRef;
  starSpeed: NumRef;
  galaxyOpacity: NumRef;
  galaxyScale: NumRef;
  galaxyTilt: NumRef;
}) {
  const { camera } = useThree();

  useFrame(() => {
    const p = progress.current;
    camera.position.z = camZ(p);
    camera.position.x = Math.sin(p * 6) * 1.2 * (1 - smooth(seg(p, 0.3, 0.7)));
    camera.position.y = lerp(1.8, 0, smooth(seg(p, 0.2, 0.55)));
    camera.lookAt(0, 0, camera.position.z - 30);

    starOpacity.current = smooth(seg(p, 0.03, 0.16));
    starSpeed.current = lerp(1.2, 34, smooth(seg(p, 0.32, 0.55))) * lerp(1, 0.25, smooth(seg(p, 0.66, 0.85)));
    galaxyOpacity.current = smooth(seg(p, 0.14, 0.3)) * (1 - smooth(seg(p, 0.48, 0.6)));
    galaxyScale.current = lerp(0.3, 1, smooth(seg(p, 0.14, 0.34)));
    galaxyTilt.current = lerp(-0.85, -0.05, smooth(seg(p, 0.18, 0.48)));
  });

  return null;
}

export default function IntroSequence({ onDone }: { onDone: () => void }) {
  const progress = useRef(0);
  const starOpacity = useRef(0);
  const starSpeed = useRef(1.2);
  const galaxyOpacity = useRef(0);
  const galaxyScale = useRef(0.3);
  const galaxyTilt = useRef(-0.85);

  const rootRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const tlRef = useRef<gsap.core.Tween | null>(null);
  const finished = useRef(false);
  // The cinematic waits for the scene to be compiled (or for the safety timer)
  const [ready, setReady] = useState(false);
  const markReady = useCallback(() => setReady(true), []);

  useEffect(() => {
    const safety = window.setTimeout(markReady, 3500);
    return () => window.clearTimeout(safety);
  }, [markReady]);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    tlRef.current?.kill();
    gsap.to(rootRef.current, { opacity: 0, duration: 0.6, ease: "power2.out", onComplete: onDone });
  }, [onDone]);

  useEffect(() => {
    getLenis()?.stop();
    document.documentElement.classList.add("intro-open");
    // This root is opaque black itself, so the pre-paint cover has done its job
    clearIntroCover();
    window.scrollTo(0, 0);
    return () => {
      document.documentElement.classList.remove("intro-open");
      getLenis()?.start();
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (["Escape", "Enter", " ", "Spacebar"].includes(e.key)) {
        e.preventDefault();
        finish();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finish]);

  useGSAP(
    () => {
      if (!ready) return;
      const state = { p: 0 };
      let lastPhase = "";
      tlRef.current = gsap.to(state, {
        p: 1,
        duration: DURATION,
        ease: "none",
        onUpdate: () => {
          const p = state.p;
          progress.current = p;

          if (subRef.current) {
            const s = smooth(seg(p, 0.72, 0.8)) * (1 - smooth(seg(p, 0.88, 0.94)));
            subRef.current.style.opacity = String(s);
            subRef.current.style.letterSpacing = `${lerp(0.2, 0.6, s)}em`;
          }
          if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;

          const phase = [...PHASES].reverse().find(([at]) => p >= at)?.[1] ?? "";
          if (phase !== lastPhase && phaseRef.current) {
            lastPhase = phase;
            phaseRef.current.textContent = phase;
          }
          if (rootRef.current) rootRef.current.style.opacity = String(1 - smooth(seg(p, 0.93, 1)));
        },
        onComplete: () => {
          finished.current = true;
          onDone();
        },
      });
    },
    { scope: rootRef, dependencies: [ready] }
  );

  return (
    <div ref={rootRef} className="intro-root" role="dialog" aria-label="Intro animation">
      <Canvas
        camera={{ position: [0, 1.8, 22], fov: 55, near: 0.1, far: 400 }}
        dpr={[1, 1.6]}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        onCreated={({ gl }) => gl.setClearColor("#050506")}
      >
        <ambientLight intensity={0.3} />
        <directionalLight position={[-6, 8, 10]} intensity={1.6} />
        <pointLight position={[-10, 2, NAME_Z + 8]} intensity={120} distance={40} color="#a78bfa" />
        <pointLight position={[10, -3, NAME_Z + 8]} intensity={80} distance={40} color="#e4e4e7" />

        <IntroRig
          progress={progress}
          starOpacity={starOpacity}
          starSpeed={starSpeed}
          galaxyOpacity={galaxyOpacity}
          galaxyScale={galaxyScale}
          galaxyTilt={galaxyTilt}
        />
        <FollowCamera>
          <Starfield count={1500} depth={170} speedRef={starSpeed} opacityRef={starOpacity} />
        </FollowCamera>
        <TiltGroup tilt={galaxyTilt} position={[0, 0, -2]}>
          <GalaxyDisc
            count={6500}
            opacityRef={galaxyOpacity}
            scaleRef={galaxyScale}
            rotationSpeed={0.16}
            intensity={0.6}
            inner="#ffffff"
            mid="#c9c9d4"
            outer="#8b7bff"
          />
        </TiltGroup>
        <Suspense fallback={null}>
          <AssemblingName progress={progress} />
          <Warmup onReady={markReady} />
        </Suspense>
      </Canvas>

      <div className="intro-name-wrap" aria-hidden>
        <div ref={subRef} className="intro-sub mono">
          AI &amp; DATA SCIENCE DEVELOPER
        </div>
      </div>

      <div className="intro-hud mono">
        <span ref={phaseRef} className="intro-phase">
          {ready ? "BOOTING" : "PREPARING"}
        </span>
        <button type="button" onClick={finish} className="intro-skip">
          SKIP INTRO →
        </button>
      </div>
      <div className={`intro-bar ${ready ? "" : "is-loading"}`} aria-hidden>
        <span ref={barRef} />
      </div>
    </div>
  );
}
