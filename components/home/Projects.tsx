"use client";

import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowUpRight } from "lucide-react";
import SectionTitle from "./SectionTitle";
import { projects } from "../../data/projects";
import { prefersReducedMotion } from "../../utils/scroll";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/* Selected Work turns the whole page light while it's on screen (the fixed nav and
   cursor invert automatically via mix-blend-mode), then hands back to dark. */
export default function Projects() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const html = document.documentElement;
      ScrollTrigger.create({
        trigger: root.current,
        start: "top 55%",
        end: "bottom 45%",
        onToggle: (self) => {
          if (self.isActive) html.dataset.theme = "light";
          else delete html.dataset.theme;
        },
      });

      if (!prefersReducedMotion()) {
        gsap.utils.toArray<HTMLElement>(".work-card").forEach((card) => {
          const media = card.querySelector(".work-card__media");
          gsap.from(card.querySelectorAll(".work-card__meta, .work-card__title, .work-card__lead"), {
            y: 50,
            opacity: 0,
            duration: 1.1,
            stagger: 0.08,
            ease: "expo.out",
            scrollTrigger: { trigger: card, start: "top 82%", once: true },
          });
          if (media) {
            gsap.fromTo(
              media,
              { clipPath: "inset(0% 100% 0% 0% round 20px)" },
              {
                clipPath: "inset(0% 0% 0% 0% round 20px)",
                duration: 1.3,
                ease: "expo.inOut",
                scrollTrigger: { trigger: card, start: "top 78%", once: true },
              }
            );
          }
        });
      }

      return () => {
        delete html.dataset.theme;
      };
    },
    { scope: root }
  );

  return (
    <section ref={root} id="work" className="section work-section">
      <div className="section-inner">
        <div className="work-head">
          <SectionTitle first="Selected" second="Work" eyebrow="/ 05 — Projects" />
          <span className="work-count mono">({String(projects.length).padStart(2, "0")})</span>
        </div>

        <div className="work-list">
          {projects.map((p) => (
            <Link
              key={p.slug}
              href={`/projects/${p.slug}`}
              className="work-card"
              data-cursor="view"
              data-cursor-label="VIEW"
            >
              <div className="work-card__meta mono">
                <span>{p.n}</span>
                <span>{p.year ?? "Project"}</span>
                <span>{p.category}</span>
              </div>

              <div className="work-card__body">
                <h3 className="display work-card__title">{p.title}</h3>
                <p className="work-card__lead">{p.tagline}</p>
                <div className="work-card__more">
                  <div>
                    <p>{p.desc}</p>
                    <ul className="mono">
                      {p.tech.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="work-card__media">
                {p.study.media?.image && (
                  <img src={p.study.media.image} alt="" loading="lazy" decoding="async" width={1600} height={900} />
                )}
                <span className="work-card__arrow" aria-hidden>
                  <ArrowUpRight size={22} />
                </span>
              </div>
            </Link>
          ))}
        </div>

        <Link href="/projects" className="work-all" data-cursor="link">
          <span className="display">All projects ({String(projects.length).padStart(2, "0")})</span>
          <span className="mono">
            View <ArrowUpRight size={14} />
          </span>
        </Link>
      </div>
    </section>
  );
}
