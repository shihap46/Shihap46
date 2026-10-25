"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SectionTitle from "./SectionTitle";
import SplitText from "../site/SplitText";
import { about, academic, profile, services } from "../../data/site";
import { prefersReducedMotion } from "../../utils/scroll";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function About() {
  const root = useRef<HTMLElement>(null);
  const year = useRef<HTMLSpanElement>(null);
  // Touch screens have no hover, so a tap toggles the photo's real colour
  const [photoColor, setPhotoColor] = useState(false);

  useGSAP(
    () => {
      const reduced = prefersReducedMotion();

      // Graduation year counts up from the start year when the card comes into view
      const counter = { v: academic.start };
      ScrollTrigger.create({
        trigger: year.current,
        start: "top 85%",
        once: true,
        onEnter: () =>
          gsap.to(counter, {
            v: academic.end,
            duration: reduced ? 0 : 1.6,
            ease: "power2.out",
            onUpdate: () => {
              if (year.current) year.current.textContent = String(Math.round(counter.v));
            },
          }),
      });

      if (reduced) return;

      // Portrait: clip-path reveal from the bottom, then a slow parallax zoom-out
      gsap.fromTo(
        ".about-photo",
        { clipPath: "inset(100% 0% 0% 0% round 28px)" },
        {
          clipPath: "inset(0% 0% 0% 0% round 28px)",
          duration: 1.4,
          ease: "expo.inOut",
          scrollTrigger: { trigger: ".about-photo", start: "top 80%", once: true },
        }
      );
      gsap.fromTo(
        ".about-photo img",
        { scale: 1.3 },
        { scale: 1, ease: "none", scrollTrigger: { trigger: ".about-photo", start: "top bottom", end: "bottom top", scrub: true } }
      );

      gsap.from(".about-card", {
        y: 60,
        opacity: 0,
        duration: 1.1,
        ease: "expo.out",
        stagger: 0.09,
        scrollTrigger: { trigger: ".about-bento", start: "top 75%", once: true },
      });
    },
    { scope: root }
  );

  return (
    <section ref={root} id="about" className="section about">
      <div className="section-inner">
        <SectionTitle first="About" second="Me" eyebrow="/ 01 — Who I am" />

        <div className="about-bento">
          <figure
            className={`about-photo ${photoColor ? "is-color" : ""}`}
            data-cursor="image"
            onClick={() => setPhotoColor((c) => !c)}
          >
            <img
              src="/images/shihap-about.jpg"
              alt={`Portrait of ${profile.name}`}
              width={1058}
              height={1024}
              loading="lazy"
              decoding="async"
            />
            <figcaption className="mono">
              {profile.name} · {academic.short}
              <span className="about-photo__hint" aria-hidden />
            </figcaption>
          </figure>

          <div className="about-right">
            <div className="about-top">
              <div className="about-card about-intro">
                <SplitText as="p" text={about.intro} by="words" stagger={0.012} />
              </div>
              <div className="about-card about-year">
                <span ref={year} className="about-year__num display-wide">
                  {academic.end}
                </span>
                <span className="about-year__label">
                  graduating {academic.short.replace("B.TECH", "B.Tech")} · {academic.college}
                </span>
              </div>
            </div>

            <div className="about-services">
              {services.map((s, i) => (
                <article key={s.title} className="about-card about-service">
                  <span className="mono about-service__n">0{i + 1}</span>
                  <h3 className="display-wide about-service__title">{s.title}</h3>
                  <p>{s.body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mt-8">
          <Link href="/about" className="work-all" data-cursor="link">
            <span className="display">More about me</span>
            <span className="mono">
              Open <ArrowUpRight size={14} />
            </span>
          </Link>
          <Link
            href="/resume"
            className="mono text-xs uppercase tracking-wider text-neutral-300 hover:text-[var(--acid)] transition flex items-center gap-2 py-3 px-6 rounded-full border border-white/10 hover:border-white/30 glass"
            data-cursor="link"
          >
            <span>View Résumé</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
