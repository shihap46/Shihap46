"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "../utils/scroll";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// Scroll-triggered entrance. Content is in the DOM either way, so nothing is
// hidden if JS never runs or the visitor asked for reduced motion.
export default function Reveal({
  children,
  className = "",
  y = 42,
  delay = 0,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  y?: number;
  delay?: number;
  as?: "div" | "section" | "li" | "article";
}) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.from(ref.current, {
        opacity: 0,
        y,
        duration: 0.9,
        delay,
        ease: "power3.out",
        scrollTrigger: { trigger: ref.current, start: "top 88%", once: true },
      });
    },
    { scope: ref }
  );

  return (
    // @ts-expect-error -- polymorphic tag with a shared ref type
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
