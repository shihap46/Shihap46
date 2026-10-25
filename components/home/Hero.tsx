"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SplitText from "../site/SplitText";
import { useGame } from "../../context/GameContext";
import { academic, profile } from "../../data/site";
import { prefersReducedMotion } from "../../utils/scroll";
import { useIntroFinished } from "../../utils/intro";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const HeroScene = dynamic(() => import("../HeroScene"), { ssr: false });
const Hero3DName = dynamic(() => import("../Hero3DName"), { ssr: false });

export default function Hero() {
  const { completeQuest } = useGame();
  const root = useRef<HTMLElement>(null);
  const nameWrap = useRef<HTMLDivElement>(null);
  const [nameReady, setNameReady] = useState(false);
  // The cinematic covers the hero, so its 3D scenes only start once it has finished
  const sceneReady = useIntroFinished();
  const onNameReady = useCallback(() => setNameReady(true), []);

  useGSAP(
    () => {
      ScrollTrigger.create({
        trigger: root.current,
        start: "top top",
        end: "bottom top",
        onLeave: () => completeQuest("explore_site"),
      });
      if (prefersReducedMotion()) return;
      // Cinematic exit: the name drifts up and recedes as the hero scrolls away
      gsap.to(nameWrap.current, {
        yPercent: -35,
        scale: 0.88,
        opacity: 0.15,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
      });
      gsap.from(".hero-meta > *", { y: 30, opacity: 0, duration: 1, stagger: 0.1, ease: "expo.out", delay: 0.6 });
    },
    { scope: root }
  );

  return (
    <section ref={root} id="top" className="hero">
      <div className="absolute inset-0 canvas-fade" aria-hidden>
        {sceneReady && <HeroScene />}
      </div>
      <div className="hero-vignette" aria-hidden />

      <div className="hero-inner">
        <div className="hero-kicker mono">
          <span className="hero-kicker__line" aria-hidden />
          <SplitText text="AI & Data Science Developer" by="chars" immediate delay={0.3} stagger={0.02} />
        </div>

        {/* DOM heading reserves the space and stays for screen readers; 3D letters draw over it */}
        <div ref={nameWrap} className="hero-name-wrap">
          <h1 className={`display hero-name ${nameReady ? "opacity-0" : ""}`}>SHIHAP</h1>
          <div className="absolute -inset-y-[18%] -inset-x-[7%]" aria-hidden>
            {sceneReady && <Hero3DName onReady={onNameReady} />}
          </div>
        </div>

        <div className="hero-meta">
          <p className="hero-meta__lead">
            Building <em>intelligent software</em> and interactive web experiences — with motion, clarity and clean code.
          </p>
          <div className="hero-meta__row mono">
            <span>
              Located in <b>{profile.location}</b>
            </span>
            <span>
              {academic.short} · {academic.college} · {academic.start}—{academic.end}
            </span>
            <span className="hero-scroll">
              Scroll down to explore <i aria-hidden>↓</i>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
