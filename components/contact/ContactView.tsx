"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import ContactForm from "./ContactForm";
import ResumeButton from "../site/ResumeButton";
import { profile } from "../../data/site";
import { prefersReducedMotion } from "../../utils/scroll";

gsap.registerPlugin(useGSAP);

const CODE_LINES = [
  { t: "idea", c: "= your_message()" },
  { t: "model", c: "= build(idea)" },
  { t: "ui", c: "= design(model)" },
  { t: "ship", c: "(ui) ✓" },
];

/* A small 3D laptop that floats, leans toward the pointer and "types" the build plan. */
function Laptop() {
  const tilt = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = tilt.current;
    if (!el || prefersReducedMotion() || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const rx = gsap.quickTo(el, "rotationX", { duration: 1, ease: "power3" });
    const ry = gsap.quickTo(el, "rotationY", { duration: 1, ease: "power3" });
    const onMove = (e: PointerEvent) => {
      rx((e.clientY / window.innerHeight - 0.5) * -14);
      ry((e.clientX / window.innerWidth - 0.5) * 18);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <div className="cp-laptop-wrap" aria-hidden>
      <div ref={tilt} className="cp-laptop-tilt">
        <div className="cp-laptop">
          <div className="cp-laptop__screen">
            <div className="cp-laptop__display mono">
              {CODE_LINES.map((line, i) => (
                <p key={line.t} style={{ animationDelay: `${0.6 + i * 0.7}s` }}>
                  <b>{line.t}</b> {line.c}
                </p>
              ))}
              <span className="cp-laptop__caret" />
            </div>
          </div>
          <div className="cp-laptop__base">
            <i />
          </div>
        </div>
        <div className="cp-laptop__shadow" />
      </div>
    </div>
  );
}

export default function ContactView() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.from(".cp-line > span", { yPercent: 114, duration: 1.2, stagger: 0.1, ease: "expo.out", delay: 0.15 });
      gsap.from(".cp-avatar", { scale: 0, rotate: -90, duration: 1.1, ease: "back.out(1.6)", delay: 0.1 });
      gsap.from([".cp-laptop-wrap", ".cp-grp"], { y: 40, opacity: 0, duration: 1, stagger: 0.1, ease: "expo.out", delay: 0.5 });
    },
    { scope: root }
  );

  return (
    <main ref={root} className="contact-page">
      <header className="cp-head">
        <div className="cp-avatar" data-cursor="image">
          <img src="/images/shihap-about.jpg" alt={`${profile.name}`} width={1058} height={1024} />
        </div>
        <h1 className="cp-title display">
          <span className="cp-line">
            <span>Tell me</span>
          </span>
          <span className="cp-line">
            <span>about your</span>
          </span>
          <span className="cp-line">
            <span>
              idea <em>:)</em>
            </span>
          </span>
        </h1>
      </header>

      <div className="cp-grid">
        <ContactForm />

        <aside className="cp-side">
          <Laptop />
          <div className="cp-info">
            <div className="cp-grp">
              <p className="cp-lbl">Further inquiries</p>
              <a className="cp-val cp-link" href={`mailto:${profile.email}`}>
                {profile.email}
              </a>
              <a className="cp-val cp-link" href={`tel:${profile.phone}`}>
                {profile.phoneFormatted || profile.phone}
              </a>
              <p className="cp-val">Located in {profile.location} 📍</p>
            </div>
            <div className="cp-grp">
              <p className="cp-lbl">Résumé</p>
              <div className="flex flex-col gap-2 items-start">
                <ResumeButton label="Download CV" />
                <Link
                  href="/resume"
                  className="mono text-xs text-neutral-400 hover:text-white transition flex items-center gap-1 mt-1"
                >
                  <span>View interactive résumé</span>
                  <span aria-hidden>→</span>
                </Link>
              </div>
            </div>
            <div className="cp-grp cp-soc">
              <p className="cp-lbl">Social media</p>
              <a href={profile.github} target="_blank" rel="noreferrer">
                GitHub
              </a>
              <a href={profile.linkedin} target="_blank" rel="noreferrer">
                LinkedIn
              </a>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
