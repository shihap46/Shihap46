"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowUpRight } from "lucide-react";
import SplitText from "../site/SplitText";
import ResumeButton from "../site/ResumeButton";
import {
  about,
  academic,
  creativeGroup,
  creativeLab,
  education,
  processSteps,
  profile,
  services,
  skillCount,
  skillGroups,
} from "../../data/site";
import { featuredProject, projects } from "../../data/projects";
import { prefersReducedMotion } from "../../utils/scroll";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// The hero animates in once the page transition has lifted
const ENTER_DELAY = 1.05;

const facts = [
  { k: "Based in", v: profile.location },
  { k: "Studying", v: academic.degree },
  { k: "College", v: academic.college },
  { k: "Year", v: academic.status },
  { k: "Status", v: "Available for internships", live: true },
];

const stats = [
  { value: skillCount, suffix: "+", label: "Tools & skills" },
  { value: projects.length, suffix: "", label: "Case studies" },
  { value: creativeLab.length, suffix: "", label: "Design disciplines" },
  { value: academic.end - academic.start, suffix: " yrs", label: `${academic.short.replace("B.TECH", "B.Tech")} degree` },
];

const CreativeIcon = creativeGroup.icon;

export default function AboutView() {
  const root = useRef<HTMLElement>(null);
  // Touch screens have no hover, so a tap toggles the portrait's real colour
  const [photoColor, setPhotoColor] = useState(false);

  useGSAP(
    () => {
      const reduced = prefersReducedMotion();

      // Stats count up when they come into view
      gsap.utils.toArray<HTMLElement>(".ab-stat__num").forEach((el) => {
        const target = Number(el.dataset.count);
        const suffix = el.dataset.suffix ?? "";
        const counter = { v: 0 };
        if (!reduced) el.textContent = `0${suffix}`;
        ScrollTrigger.create({
          trigger: el,
          start: "top 88%",
          once: true,
          onEnter: () =>
            gsap.to(counter, {
              v: target,
              duration: reduced ? 0 : 1.6,
              ease: "power2.out",
              onUpdate: () => {
                el.textContent = `${Math.round(counter.v)}${suffix}`;
              },
            }),
        });
      });

      // Journey milestones light up as the line passes them
      gsap.utils.toArray<HTMLElement>(".ab-mile").forEach((mile) => {
        ScrollTrigger.create({ trigger: mile, start: "top 62%", toggleClass: { targets: mile, className: "is-on" } });
      });

      if (reduced) return;

      // Hero
      gsap.from(".ab-in", { y: 34, opacity: 0, duration: 1, stagger: 0.08, ease: "expo.out", delay: ENTER_DELAY + 0.25 });
      gsap.fromTo(
        ".ab-photo",
        { clipPath: "inset(100% 0% 0% 0% round 28px)" },
        { clipPath: "inset(0% 0% 0% 0% round 28px)", duration: 1.4, ease: "expo.inOut", delay: ENTER_DELAY }
      );
      gsap.fromTo(".ab-photo img", { scale: 1.35 }, { scale: 1, duration: 2, ease: "expo.out", delay: ENTER_DELAY });

      // Everything below the hero rises in as it scrolls into view
      ScrollTrigger.batch(".ab-reveal", {
        start: "top 88%",
        once: true,
        onEnter: (batch) => gsap.from(batch, { y: 50, opacity: 0, duration: 1, stagger: 0.08, ease: "expo.out" }),
      });

      // The journey line draws itself while scrolling through the timeline
      gsap.fromTo(
        ".ab-timeline__line i",
        { scaleY: 0 },
        { scaleY: 1, ease: "none", scrollTrigger: { trigger: ".ab-timeline", start: "top 62%", end: "bottom 62%", scrub: 0.6 } }
      );
    },
    { scope: root }
  );

  return (
    <main ref={root} className="about-page">
      {/* ─── Hero ─── */}
      <section className="ab-hero">
        <div className="ab-hero__text">
          <p className="mono ab-eyebrow ab-in">/ 02 — About</p>
          <h1 className="display ab-title">
            <SplitText text="About" by="chars" immediate delay={ENTER_DELAY} />
            <SplitText text="Me" by="chars" immediate delay={ENTER_DELAY + 0.15} />
          </h1>
          <p className="ab-lead ab-in">
            <em>{about.greeting}</em> {about.line}
          </p>
          <dl className="ab-facts">
            {facts.map((f) => (
              <div key={f.k} className="ab-fact ab-in">
                <dt className="mono">{f.k}</dt>
                <dd>
                  {f.live && <span className="ab-fact__dot" aria-hidden />}
                  {f.v}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <figure
          className={`ab-photo ${photoColor ? "is-color" : ""}`}
          data-cursor="image"
          onClick={() => setPhotoColor((c) => !c)}
        >
          <img src="/images/shihap-about.jpg" alt={`Portrait of ${profile.name}`} width={1058} height={1024} />
          <figcaption className="mono">
            {profile.name} · {academic.college}
            <span className="about-photo__hint" aria-hidden />
          </figcaption>
        </figure>
      </section>

      {/* ─── Story ─── */}
      <section className="ab-section ab-story">
        <p className="mono ab-label ab-reveal">My story</p>
        <div>
          <SplitText as="p" className="ab-story__big" text={about.intro} by="words" stagger={0.008} />
          <div className="ab-story__cols">
            <p className="ab-reveal">
              In {featuredProject.year} I built the <b>Real-Time Blood Donor Network</b> — an app that connects patients and
              hospital blood banks with compatible nearby donors in real time. It&apos;s a good sample of how I think: start
              from a real problem, then shape the data, the logic and the interface around the people who will use it.
            </p>
            <p className="ab-reveal">
              Next to code, I design. <b>Logos, branding, posters, brochures and print layouts</b> let me carry a project all
              the way from a trained model to something that looks finished — so the work is useful and easy to love.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Numbers ─── */}
      <section className="ab-stats" aria-label="At a glance">
        {stats.map((s) => (
          <div key={s.label} className="ab-stat ab-reveal">
            <span className="display ab-stat__num" data-count={s.value} data-suffix={s.suffix}>
              {s.value}
              {s.suffix}
            </span>
            <span className="mono ab-stat__label">{s.label}</span>
          </div>
        ))}
      </section>

      {/* ─── What I do ─── */}
      <section className="ab-section">
        <header className="ab-head">
          <div>
            <p className="mono ab-label">What I do</p>
            <h2 className="display ab-h2">Three things, done properly</h2>
          </div>
          <p className="ab-head__note">Data and models, the interface around them, and the visuals that make it all feel finished.</p>
        </header>
        <div className="ab-services">
          {services.map((s, i) => (
            <article key={s.title} className="ab-card ab-reveal">
              <span className="mono ab-card__n">0{i + 1}</span>
              <h3 className="display-wide ab-card__title">{s.title}</h3>
              <p>{s.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ─── Toolkit ─── */}
      <section className="ab-section">
        <header className="ab-head">
          <div>
            <p className="mono ab-label">Toolkit</p>
            <h2 className="display ab-h2">What I work with</h2>
          </div>
          <p className="ab-head__note">
            {skillCount}+ languages, libraries and tools — grouped by the part of a project they belong to.
          </p>
        </header>
        <div className="ab-tools">
          {skillGroups.map((g) => {
            const Icon = g.icon;
            return (
              <article key={g.id} className="ab-tool ab-reveal">
                <div className="ab-tool__top">
                  <Icon size={18} aria-hidden />
                  <h3 className="mono">{g.title}</h3>
                  <span className="mono ab-tool__count">{String(g.items.length).padStart(2, "0")}</span>
                </div>
                <p className="ab-tool__summary">{g.summary}</p>
                <ul className="ab-chips">
                  {g.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            );
          })}
          <article className="ab-tool ab-tool--creative ab-reveal">
            <div className="ab-tool__top">
              <CreativeIcon size={18} aria-hidden />
              <h3 className="mono">Graphic design</h3>
              <span className="mono ab-tool__count">{String(creativeLab.length).padStart(2, "0")}</span>
            </div>
            <p className="ab-tool__summary">{creativeGroup.summary}</p>
            <ul className="ab-chips">
              {creativeLab.map((c) => (
                <li key={c.id}>{c.title}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      {/* ─── Journey ─── */}
      <section className="ab-section">
        <header className="ab-head">
          <div>
            <p className="mono ab-label">Journey</p>
            <h2 className="display ab-h2">{academic.degree}</h2>
          </div>
          <p className="ab-head__note">
            {academic.college} · {academic.start} — {academic.end}. Where I started, what I&apos;ve built so far and what comes next.
          </p>
        </header>
        <ol className="ab-timeline">
          <span className="ab-timeline__line" aria-hidden>
            <i />
          </span>
          {education.milestones.map((m) => (
            <li key={m.year} className="ab-mile">
              <span className="display ab-mile__year">{m.year}</span>
              <div>
                <h3>{m.title}</h3>
                <p>{m.note}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ─── How I work ─── */}
      <section className="ab-section">
        <header className="ab-head">
          <div>
            <p className="mono ab-label">How I work</p>
            <h2 className="display ab-h2">Six steps, every project</h2>
          </div>
          <p className="ab-head__note">Every project starts with a question — and ends with something shipped and documented.</p>
        </header>
        <ol className="ab-steps">
          {processSteps.map((s) => (
            <li key={s.n} className="ab-step ab-reveal">
              <span className="display ab-step__n">{s.n}</span>
              <div>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
                <span className="mono ab-step__note">{s.note}</span>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ─── Projects ─── */}
      <section className="ab-section">
        <header className="ab-head">
          <div>
            <p className="mono ab-label">Selected projects</p>
            <h2 className="display ab-h2">Things I&apos;ve made</h2>
          </div>
          <p className="ab-head__note">Each one opens as a full case study — the problem, how I built it and the result.</p>
        </header>
        <div className="ab-projects">
          {projects.map((p) => (
            <Link
              key={p.slug}
              href={`/projects/${p.slug}`}
              className="ab-project ab-reveal"
              data-cursor="view"
              data-cursor-label="VIEW"
            >
              <span className="mono ab-project__n">{p.n}</span>
              <div>
                <h3 className="display">{p.title}</h3>
                <p>{p.tagline}</p>
              </div>
              <span className="mono ab-project__cat">{p.category}</span>
              <ArrowUpRight className="ab-project__arrow" aria-hidden />
            </Link>
          ))}
        </div>
      </section>

      {/* ─── Call to action ─── */}
      <section className="ab-cta">
        <p className="cta-kicker ab-reveal">Like what you see?</p>
        <Link href="/contact" className="cta-box ab-reveal" data-cursor="link">
          <span className="cta-box__text display">Let&apos;s talk</span>
          <span className="cta-box__arrow" aria-hidden>
            <ArrowUpRight />
          </span>
        </Link>
        <div className="cta-sub ab-reveal flex flex-wrap items-center justify-center gap-4">
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
      </section>
    </main>
  );
}
