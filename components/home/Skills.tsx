"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SectionTitle from "./SectionTitle";
import { useGame } from "../../context/GameContext";
import { skillGroups, skillRows } from "../../data/site";
import { prefersReducedMotion } from "../../utils/scroll";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const allTools = [...new Set(skillGroups.flatMap((g) => g.items))];

/* Skills as typography: each oversized word fills with light, left to right, as it
   scrolls through the middle of the screen. Hovering a word opens its spacing. */
export default function Skills() {
  const { completeQuest } = useGame();
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const words = gsap.utils.toArray<HTMLElement>(".skill-word");
      if (prefersReducedMotion()) {
        words.forEach((w) => (w.style.backgroundPosition = "0% 0"));
        return;
      }
      words.forEach((word) => {
        gsap.fromTo(
          word,
          { backgroundPosition: "100% 0" },
          {
            backgroundPosition: "0% 0",
            ease: "none",
            scrollTrigger: { trigger: word, start: "top 85%", end: "top 40%", scrub: 0.6 },
          }
        );
      });
      gsap.utils.toArray<HTMLElement>(".skill-row__label").forEach((label) => {
        gsap.from(label, { x: -30, opacity: 0, duration: 0.9, ease: "expo.out", scrollTrigger: { trigger: label, start: "top 88%", once: true } });
      });
    },
    { scope: root }
  );

  return (
    <section ref={root} id="skills" className="section skills">
      <div className="section-inner">
        <SectionTitle first="Skills" second="& Tools" eyebrow="/ 02 — What I work with" />

        <div className="skill-rows" onPointerEnter={() => completeQuest("orbit_skills")}>
          {skillRows.map((row) => (
            <div key={row.label} className="skill-row">
              <span className="skill-row__label">{row.label}</span>
              <div className="skill-row__words">
                {row.words.map((word, i) => (
                  <span key={word} className="skill-word" data-cursor="link">
                    {word}
                    {i < row.words.length - 1 && <span className="skill-word__sep" aria-hidden> / </span>}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Everything else I use, as a slow ambient ticker */}
      <div className="skills-ticker" aria-label="Full toolset">
        <div className="skills-ticker__track mono">
          {[0, 1].map((copy) => (
            <span key={copy} aria-hidden={copy === 1}>
              {allTools.map((tool) => (
                <span key={`${copy}-${tool}`} className="skills-ticker__item">
                  {tool}
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
