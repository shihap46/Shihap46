"use client";

import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowUpRight } from "lucide-react";
import ResumeButton from "../site/ResumeButton";
import { prefersReducedMotion } from "../../utils/scroll";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/* The last section of the home page: one huge "Get in touch" banner that leads to the
   contact page, with the résumé download underneath. The fluid animation runs behind it. */
export default function Contact() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.from([".cta-kicker", ".cta-box", ".cta-sub"], {
        y: 60,
        opacity: 0,
        duration: 1.1,
        stagger: 0.12,
        ease: "expo.out",
        scrollTrigger: { trigger: root.current, start: "top 70%", once: true },
      });
    },
    { scope: root }
  );

  return (
    <section ref={root} id="contact" className="section contact-cta">
      <div className="section-inner">
        <p className="cta-kicker">Have an idea worth building?</p>
        <Link href="/contact" className="cta-box" data-cursor="link">
          <span className="cta-box__text display">Get in touch</span>
          <span className="cta-box__arrow" aria-hidden>
            <ArrowUpRight />
          </span>
        </Link>
        <div className="cta-sub flex flex-wrap items-center justify-center gap-4">
          <ResumeButton />
          <Link
            href="/resume"
            className="mono text-xs uppercase text-neutral-300 hover:text-[var(--acid)] transition tracking-wider flex items-center gap-1.5 py-3 px-5 rounded-full border border-white/10 hover:border-white/30"
            data-cursor="link"
          >
            <span>View Full Résumé</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
