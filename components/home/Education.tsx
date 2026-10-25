"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SectionTitle from "./SectionTitle";
import { academic, education } from "../../data/site";
import { prefersReducedMotion } from "../../utils/scroll";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/* A pinned "scrubber": while the section is held in place, scrolling fills the
   2025 → 2029 line and steps through the milestones year by year. Small screens
   and reduced motion get a plain vertical list instead of the pin. */
export default function Education() {
  const root = useRef<HTMLElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(0);
  const count = education.milestones.length;

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        let last = -1;
        ScrollTrigger.create({
          trigger: frame.current,
          start: "center center",
          end: "+=130%",
          pin: true,
          scrub: 0.6,
          onUpdate: (self) => {
            if (fill.current) fill.current.style.transform = `scaleX(${self.progress})`;
            const idx = Math.min(count - 1, Math.floor(self.progress * count));
            if (idx !== last) {
              last = idx;
              setActive(idx);
            }
          },
        });
      });
      if (!prefersReducedMotion()) {
        gsap.from(".edu-intro", { y: 30, opacity: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: ".edu-intro", start: "top 85%", once: true } });
      }
      return () => mm.revert();
    },
    { scope: root }
  );

  const milestone = education.milestones[active];

  return (
    <section ref={root} id="education" className="section education">
      <div className="section-inner">
        <SectionTitle first="My" second="Education" eyebrow="/ 03 — The journey" />
        <p className="edu-intro">{education.intro}</p>

        {/* Desktop: pinned scrubber */}
        <div ref={frame} className="edu-frame">
          <div className="edu-years">
            <span className="edu-years__line" aria-hidden>
              <span ref={fill} className="edu-years__fill" />
            </span>
            {education.milestones.map((m, i) => (
              <span key={m.year} className={`edu-year ${i <= active ? "is-on" : ""}`}>
                <i className="edu-year__dot" aria-hidden />
                <b className="display">{m.year}</b>
              </span>
            ))}
          </div>

          <div className="edu-panel">
            <div className="edu-panel__degree">
              <span className="mono edu-panel__tag">
                {academic.start} — {academic.end}
              </span>
              <h3 className="display-wide edu-panel__title">
                B.Tech, Artificial Intelligence &amp; Data Science
              </h3>
              <p className="edu-panel__inst">{academic.college}</p>
            </div>
            <div className="edu-panel__milestone" key={milestone.year} aria-live="polite">
              <span className="display edu-panel__year">{milestone.year}</span>
              <span className="edu-panel__mtitle">{milestone.title}</span>
              <span className="mono edu-panel__note">{milestone.note}</span>
            </div>
          </div>
        </div>

        {/* Mobile / reduced motion: vertical timeline */}
        <ol className="edu-list">
          {education.milestones.map((m) => (
            <li key={m.year}>
              <span className="display">{m.year}</span>
              <div>
                <b>{m.title}</b>
                <span className="mono">{m.note}</span>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
