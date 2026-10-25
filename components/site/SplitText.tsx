"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "../../utils/scroll";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/* Masked text reveal: each word (or character) slides up out of its own clip mask.
   Screen readers get the plain sentence; the split spans are hidden from them. */
export default function SplitText({
  text,
  as = "span",
  className = "",
  by = "words",
  delay = 0,
  stagger,
  start = "top 88%",
  immediate = false,
}: {
  text: string;
  as?: "span" | "p" | "div" | "h2" | "h3";
  className?: string;
  by?: "words" | "chars";
  delay?: number;
  stagger?: number;
  start?: string;
  /** Animate on mount instead of when scrolled into view */
  immediate?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const Tag = as as "span";

  useGSAP(
    () => {
      if (!ref.current || prefersReducedMotion()) return;
      const pieces = ref.current.querySelectorAll(".split-inner");
      gsap.from(pieces, {
        yPercent: 118,
        rotate: by === "chars" ? 6 : 2,
        duration: 1.1,
        ease: "expo.out",
        delay,
        stagger: stagger ?? (by === "chars" ? 0.028 : 0.05),
        scrollTrigger: immediate ? undefined : { trigger: ref.current, start, once: true },
      });
    },
    { scope: ref }
  );

  const words = text.split(" ");
  return (
    <Tag ref={ref as React.RefObject<HTMLSpanElement>} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {words.map((word, wi) => (
          <span key={wi}>
            <span className="split-word">
              {by === "chars" ? (
                [...word].map((ch, ci) => (
                  <span key={ci} className="split-mask">
                    <span className="split-inner">{ch}</span>
                  </span>
                ))
              ) : (
                <span className="split-mask">
                  <span className="split-inner">{word}</span>
                </span>
              )}
            </span>
            {wi < words.length - 1 ? " " : null}
          </span>
        ))}
      </span>
    </Tag>
  );
}
