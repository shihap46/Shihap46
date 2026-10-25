"use client";

import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SplitText from "../site/SplitText";
import { processPath, processSteps } from "../../data/site";
import { prefersReducedMotion } from "../../utils/scroll";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const VIEW_W = 1000;
const VIEW_H = 2000;

/* How I Work: a winding line draws itself as you scroll, a glowing tip rides its
   leading edge, and each step appears the moment the tip reaches it. Steps are
   spaced evenly along the path's length, so they always sit on the line. */
export default function Process() {
  const root = useRef<HTMLElement>(null);
  const draw = useRef<SVGPathElement>(null);
  const tip = useRef<HTMLSpanElement>(null);
  const [anchors, setAnchors] = useState<{ x: number; y: number; t: number }[]>([]);

  // Place each step on the path once it can be measured
  useLayoutEffect(() => {
    const path = draw.current;
    if (!path) return;
    const total = path.getTotalLength();
    setAnchors(
      processSteps.map((_, i) => {
        const t = (i + 0.55) / processSteps.length;
        const pt = path.getPointAtLength(total * t);
        return { x: pt.x, y: pt.y, t };
      })
    );
  }, []);

  useGSAP(
    () => {
      const path = draw.current;
      if (!path || anchors.length === 0) return;
      const total = path.getTotalLength();
      const steps = gsap.utils.toArray<HTMLElement>(".process-step");
      const dots = gsap.utils.toArray<SVGCircleElement>(".process-dot");

      const mm = gsap.matchMedia();
      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        path.style.strokeDasharray = `${total}`;
        path.style.strokeDashoffset = `${total}`;
        ScrollTrigger.create({
          trigger: ".process-stage",
          start: "top 70%",
          end: "bottom 65%",
          scrub: 0.8,
          onUpdate: (self) => {
            const p = self.progress;
            path.style.strokeDashoffset = `${total * (1 - p)}`;
            const pt = path.getPointAtLength(total * Math.max(0.0001, p));
            if (tip.current) {
              tip.current.style.left = `${(pt.x / VIEW_W) * 100}%`;
              tip.current.style.top = `${(pt.y / VIEW_H) * 100}%`;
              tip.current.style.opacity = p > 0.002 && p < 0.998 ? "1" : "0";
            }
            anchors.forEach((a, i) => {
              const on = p >= a.t - 0.015;
              steps[i]?.classList.toggle("is-in", on);
              dots[i]?.classList.toggle("is-in", on);
            });
          },
        });
        return () => {
          path.style.strokeDasharray = "";
          path.style.strokeDashoffset = "";
        };
      });

      // Small screens / reduced motion: steps simply reveal as they enter
      mm.add("(max-width: 1023px), (prefers-reduced-motion: reduce)", () => {
        steps.forEach((step) => {
          ScrollTrigger.create({ trigger: step, start: "top 88%", once: true, onEnter: () => step.classList.add("is-in") });
        });
        dots.forEach((d) => d.classList.add("is-in"));
      });

      if (!prefersReducedMotion()) {
        gsap.from(".process-head > *", {
          y: 40,
          opacity: 0,
          duration: 1,
          stagger: 0.1,
          ease: "expo.out",
          scrollTrigger: { trigger: ".process-head", start: "top 80%", once: true },
        });
      }
      return () => mm.revert();
    },
    { scope: root, dependencies: [anchors] }
  );

  return (
    <section ref={root} id="process" className="section process">
      <div className="section-inner">
        <div className="process-head">
          <p className="mono section-title__eyebrow">My Process</p>
          <h2 className="display process-title">
            How I Work
          </h2>
          <p className="process-sub mono">every project starts with a question · always learning, always building</p>
        </div>

        <div className="process-stage">
          <svg className="process-svg" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} preserveAspectRatio="none" aria-hidden>
            <path d={processPath} className="process-track" />
            <path ref={draw} d={processPath} className="process-draw" />
            {anchors.map((a, i) => (
              <circle key={i} cx={a.x} cy={a.y} r={7} className="process-dot" />
            ))}
          </svg>
          <span ref={tip} className="process-tip" aria-hidden />

          <ol className="process-steps">
            {processSteps.map((step, i) => {
              const a = anchors[i];
              // Text sits on the opposite side of the line from where it curves
              const side = a && a.x > VIEW_W / 2 ? "left" : "right";
              return (
                <li
                  key={step.n}
                  className={`process-step process-step--${side}`}
                  style={a ? ({ "--step-y": `${(a.y / VIEW_H) * 100}%`, "--step-x": `${(a.x / VIEW_W) * 100}%` } as React.CSSProperties) : undefined}
                >
                  <span className="process-step__n display">{step.n}</span>
                  <h3 className="process-step__title">{step.title}</h3>
                  <p className="process-step__body">— {step.body}</p>
                  <span className="process-step__note mono">{step.note}</span>
                </li>
              );
            })}
          </ol>
        </div>

        <SplitText as="p" text="That's how I work." by="chars" className="display process-closer" stagger={0.02} />
      </div>
    </section>
  );
}
