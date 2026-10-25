"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, GraduationCap, Mail, PenTool } from "lucide-react";
import TiltCard from "./TiltCard";
import Reveal from "./Reveal";
import FeaturedProject from "./FeaturedProject";
import { featuredProject } from "../data/projects";
import { academic, creativeLab, creativeGroup, pipeline, profile, skillCount, skillGroups } from "../data/site";

const WorkScene = dynamic(() => import("./WorkScene"), { ssr: false });
const FloatingGeometry = dynamic(() => import("./FloatingGeometry"), { ssr: false });

const techDisciplines = skillGroups.filter((g) => ["ai", "dev", "threed"].includes(g.id));

function SectionHead({
  eyebrow,
  title,
  note,
  color,
}: {
  eyebrow: string;
  title: React.ReactNode;
  note?: string;
  color?: string;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14 md:mb-20">
      <div>
        <div className="mono text-xs text-neutral-500 mb-4 flex items-center gap-3">
          <span>{eyebrow}</span>
          <span className="h-px bg-neutral-800 w-16" />
        </div>
        <h2
          className="display uppercase text-5xl sm:text-6xl md:text-8xl leading-[.8]"
          style={color ? { color } : undefined}
        >
          {title}
        </h2>
      </div>
      {note && <p className="mono text-xs text-neutral-400 max-w-sm leading-relaxed">{note}</p>}
    </div>
  );
}

export default function WorkView() {
  const years = Array.from({ length: academic.end - academic.start + 1 }, (_, i) => academic.start + i);
  const builtYear = Number(featuredProject.year ?? academic.start);
  const milestones: Record<number, string> = {
    [academic.start]: `Started ${academic.degree}`,
    [builtYear]: "Built the Real-Time Blood Donor Network",
    [academic.end]: "Graduation",
  };

  return (
    <main className="relative selection:bg-[var(--acid)] selection:text-black">
      {/* ─── HERO WITH 3D DISCIPLINE ORBIT ─── */}
      <section
        id="top"
        className="relative min-h-screen overflow-hidden px-5 md:px-10 pt-40 md:pt-44 pb-12 flex flex-col justify-center"
      >
        <div className="absolute inset-0 opacity-50 md:opacity-100 canvas-fade">
          <WorkScene />
        </div>

        <div className="relative z-10 max-w-7xl w-full mx-auto pointer-events-none">
          <div className="mono text-xs md:text-sm mb-6 flex items-center gap-3 text-neutral-300">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--acid)] animate-pulse" />
            <span>/ 02 — WORK</span>
          </div>

          <h1 className="display uppercase text-[20vw] md:text-[11vw] leading-[.8] tracking-tight mb-8">
            WORK
            <br />
            <span className="text-transparent" style={{ WebkitTextStroke: "1.5px #f2f2f0" }}>
              &amp; CRAFT.
            </span>
          </h1>

          <p className="text-neutral-300 text-base md:text-xl leading-relaxed max-w-xl mb-8">
            Machine learning, deep learning, AI-powered web apps and design — the skills I bring into every project,
            and how they connect.
          </p>

          <div className="flex flex-wrap gap-2 max-w-2xl pointer-events-auto">
            {skillGroups.map((g) => (
              <a
                key={g.id}
                href={`#${g.id}`}
                className="mono text-[11px] uppercase tracking-wider glass rounded-full px-4 py-2 flex items-center gap-2 hover:border-white/30 transition"
              >
                <span className="w-2 h-2 rounded-full" style={{ background: g.color }} />
                {g.title}
              </a>
            ))}
            <Link
              href="/#creative"
              className="mono text-[11px] uppercase tracking-wider glass rounded-full px-4 py-2 flex items-center gap-2 hover:border-white/30 transition"
            >
              <span className="w-2 h-2 rounded-full" style={{ background: creativeGroup.color }} />
              Creative Lab
            </Link>
          </div>
        </div>

        <div className="relative z-10 max-w-7xl w-full mx-auto mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 border-t hairline pt-6 pointer-events-none">
          {[
            { v: "05", l: "Skill groups" },
            { v: String(skillCount), l: "Tools & skills" },
            { v: `${academic.start}—${String(academic.end).slice(2)}`, l: academic.short },
            { v: featuredProject.year ?? "—", l: "Blood donor app built" },
          ].map((s) => (
            <div key={s.l}>
              <div className="display text-4xl md:text-5xl text-white">{s.v}</div>
              <div className="mono text-[11px] text-neutral-400 mt-1 uppercase">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── DISCIPLINES ─── */}
      <section className="px-5 md:px-10 py-28 md:py-40">
        <div className="max-w-7xl mx-auto">
          <SectionHead
            eyebrow="/ 02.1 — WHAT I BUILD WITH"
            title={
              <>
                AI · DATA
                <br />· WEB
              </>
            }
            note="Boosted trees for tabular data, neural networks for images and text, and the web layer that puts both in front of people."
          />

          <div className="grid md:grid-cols-3 gap-5">
            {techDisciplines.map((g, i) => {
              const Icon = g.icon;
              return (
                <Reveal key={g.id} delay={i * 0.08}>
                  <div id={g.id} className="h-full">
                    <TiltCard className="glass rounded-3xl p-7 h-full stat-card">
                      <div className="flex items-center gap-2 mono text-xs mb-10" style={{ color: g.color }}>
                        <Icon size={16} />
                        <span>
                          0{i + 1} / {g.title.toUpperCase()}
                        </span>
                      </div>
                      <h3 className="display text-4xl md:text-5xl uppercase leading-[.9] mb-5">{g.headline}</h3>
                      <p className="text-neutral-400 text-sm leading-relaxed mb-6">{g.summary}</p>
                      <div className="flex flex-wrap gap-2">
                        {g.items.map((item) => (
                          <span
                            key={item}
                            className="mono text-[10px] px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-300"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </TiltCard>
                  </div>
                </Reveal>
              );
            })}
          </div>

          {/* Core + Tools */}
          <div className="grid md:grid-cols-2 gap-5 mt-5">
            {skillGroups
              .filter((g) => ["core", "tools"].includes(g.id))
              .map((g, i) => {
                const Icon = g.icon;
                return (
                  <Reveal key={g.id} delay={i * 0.08}>
                    <div id={g.id}>
                      <TiltCard className="glass rounded-3xl p-7 h-full stat-card">
                        <div className="flex items-center gap-2 mono text-xs mb-6" style={{ color: g.color }}>
                          <Icon size={16} />
                          <span>{g.title.toUpperCase()}</span>
                        </div>
                        <h3 className="display text-3xl uppercase leading-none mb-4">{g.headline}</h3>
                        <div className="flex flex-wrap gap-2">
                          {g.items.map((item) => (
                            <span
                              key={item}
                              className="mono text-[10px] px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-300"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </TiltCard>
                    </div>
                  </Reveal>
                );
              })}
          </div>
        </div>
      </section>

      {/* ─── CREATIVE LAB TEASER ─── */}
      <section className="relative px-5 md:px-10 py-24 md:py-32 overflow-hidden">
        <div className="absolute -left-40 top-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-[radial-gradient(circle,rgba(255,92,138,0.08)_0%,transparent_70%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto relative">
          <Reveal>
            <Link
              href="/#creative"
              className="group grid lg:grid-cols-[1fr_auto] gap-8 items-center rounded-3xl border hairline px-6 md:px-10 py-10 hover:border-[#ff5c8a]/40 transition"
            >
              <div>
                <div className="mono text-xs mb-4 flex items-center gap-2" style={{ color: creativeGroup.color }}>
                  <PenTool size={15} /> / 02.2 — CREATIVE LAB
                </div>
                <h2
                  className="display uppercase text-5xl md:text-7xl leading-[.85] mb-5"
                  style={{ color: creativeGroup.color }}
                >
                  Design work
                </h2>
                <p className="text-neutral-400 max-w-xl leading-relaxed mb-6">{creativeGroup.summary}</p>
                <div className="flex flex-wrap gap-2">
                  {creativeLab.map((c) => (
                    <span
                      key={c.id}
                      className="mono text-[11px] px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-neutral-300"
                    >
                      {c.title}
                    </span>
                  ))}
                </div>
              </div>
              <ArrowRight size={40} className="shrink-0 group-hover:translate-x-2 transition-transform" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ─── HOW THE SKILLS CONNECT ─── */}
      <section className="px-5 md:px-10 py-28 md:py-40">
        <div className="max-w-7xl mx-auto">
          <SectionHead
            eyebrow="/ 02.3 — HOW MY SKILLS CONNECT"
            title={
              <>
                DATA →
                <br />
                PRODUCT
              </>
            }
            note="A model trained in Python is served to the web with FastAPI or Flask, shown off as a quick Streamlit demo, shipped as a full Next.js product — then branded."
          />

          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {pipeline.map((p, i) => (
              <Reveal key={p.step} as="li" delay={i * 0.07} className="pipeline-step">
                <TiltCard className="glass rounded-2xl p-5 h-full">
                  <div className="mono text-[10px] text-[var(--acid)] mb-3">STEP 0{i + 1}</div>
                  <div className="display text-4xl uppercase leading-none mb-1">{p.step}</div>
                  <div className="text-xs text-neutral-400 mb-5">{p.note}</div>
                  <ul className="flex flex-wrap gap-1.5">
                    {p.tools.map((t) => (
                      <li
                        key={t}
                        className="mono text-[10px] px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300"
                      >
                        {t}
                      </li>
                    ))}
                  </ul>
                </TiltCard>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ─── FEATURED WORK ─── */}
      <section className="px-5 md:px-10 py-28 md:py-40">
        <div className="max-w-7xl mx-auto">
          <SectionHead
            eyebrow={`/ 02.4 — FEATURED WORK · ${featuredProject.year ?? ""}`}
            title={
              <>
                BUILT
                <br />
                THIS YEAR
              </>
            }
          />

          <FeaturedProject />

          <div className="mt-10 flex justify-end">
            <Link
              href="/projects"
              className="mono text-xs border border-white/20 px-6 py-4 rounded-full flex items-center gap-3 hover:bg-white hover:text-black transition"
            >
              ALL CASE STUDIES <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── ACADEMIC JOURNEY ─── */}
      <section className="px-5 md:px-10 py-28 md:py-40">
        <div className="max-w-7xl mx-auto">
          <SectionHead
            eyebrow="/ 02.5 — ACADEMIC JOURNEY"
            title={
              <>
                {academic.start} —
                <br />
                {academic.end}
              </>
            }
            note={academic.degree}
          />

          <TiltCard max={3} className="glass rounded-3xl p-6 md:p-10">
            <div className="flex items-center gap-3 mono text-xs text-sky-400 mb-10">
              <GraduationCap size={16} /> {academic.degree.toUpperCase()}
            </div>

            <ol className="timeline grid gap-3 md:gap-4" style={{ "--years": years.length } as React.CSSProperties}>
              {years.map((y, i) => {
                const reached = y <= builtYear;
                const nextReached = i < years.length - 1 && years[i + 1] <= builtYear;
                return (
                  <li key={y} className="flex flex-col">
                    <div className="relative hidden md:flex justify-center items-center h-4 mb-5">
                      {i < years.length - 1 && (
                        <span className={`timeline-seg ${nextReached ? "timeline-seg--on" : ""}`} />
                      )}
                      <span
                        className={`relative w-3.5 h-3.5 rounded-full border-2 ${
                          reached ? "bg-[var(--acid)] border-[var(--acid)]" : "bg-[#0a0a0a] border-neutral-600"
                        }`}
                      />
                    </div>
                    <div
                      className={`flex-1 rounded-2xl p-4 border ${
                        reached ? "border-[var(--acid)]/40 bg-[var(--acid)]/[0.04]" : "border-white/5 bg-white/[0.02]"
                      }`}
                    >
                      <div className={`display text-4xl ${reached ? "text-[var(--acid)]" : "text-neutral-500"}`}>{y}</div>
                      <div className="mono text-[10px] text-neutral-500 mt-1 mb-2">
                        {y === academic.start ? "START" : y === academic.end ? "FINISH" : `YEAR ${i + 1}`}
                      </div>
                      <p className="text-xs text-neutral-300 leading-relaxed">
                        {milestones[y] ?? "Coursework & new builds"}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </TiltCard>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="relative px-5 md:px-10 py-28 md:py-44 overflow-hidden">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-full md:w-1/2 h-[460px] pointer-events-none opacity-40 canvas-fade">
          <FloatingGeometry shape="torus" color="#ff5c8a" scale={2.2} speed={0.35} />
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <h2 className="display uppercase text-[15vw] md:text-[10vw] leading-[.78] mb-8">
            GOT AN IDEA?
            <br />
            <span className="text-transparent" style={{ WebkitTextStroke: "1.5px #f2f2f0" }}>
              LET&apos;S BUILD.
            </span>
          </h2>
          <p className="text-neutral-300 text-lg md:text-xl max-w-2xl leading-relaxed mb-10">
            An ML model, a web app with a model behind it, or a logo, brochure and poster for your launch — tell me
            about it.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href={`mailto:${profile.email}`}
              className="mono text-xs font-semibold bg-[var(--acid)] text-black rounded-full px-7 py-4 flex items-center gap-3 hover:bg-white transition"
            >
              <Mail size={16} /> EMAIL ME <ArrowUpRight size={16} />
            </a>
            <Link
              href="/contact"
              className="mono text-xs border border-white/20 rounded-full px-6 py-4 flex items-center gap-3 hover:bg-white hover:text-black transition"
            >
              CONTACT <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
