"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, CheckCircle2, ExternalLink, Play, Terminal } from "lucide-react";
import { useGame } from "../context/GameContext";
import TiltCard from "./TiltCard";
import Reveal from "./Reveal";
import { projects, type Project } from "../data/projects";

const FloatingGeometry = dynamic(() => import("./FloatingGeometry"), { ssr: false });
const BloodNetworkScene = dynamic(() => import("./scenes/BloodNetworkScene"), { ssr: false });
const SolarRoofScene = dynamic(() => import("./scenes/SolarRoofScene"), { ssr: false });

function SectionTitle({ n, title, color }: { n: string; title: string; color?: string }) {
  return (
    <div className="mb-8">
      <div className="mono text-[11px] text-neutral-500 mb-3 flex items-center gap-3">
        <span style={color ? { color } : undefined}>{n}</span>
        <span className="h-px bg-neutral-800 w-12" />
      </div>
      <h2 className="display uppercase text-4xl md:text-6xl leading-[.85]">{title}</h2>
    </div>
  );
}

export default function CaseStudyView({ project }: { project: Project }) {
  const { openProjectModal } = useGame();
  const { study } = project;

  const index = projects.findIndex((p) => p.slug === project.slug);
  const next = projects[(index + 1) % projects.length];

  return (
    <main className="relative selection:bg-[var(--acid)] selection:text-black">
      {/* ── HERO ── */}
      <section id="top" className="relative px-5 md:px-10 pt-36 md:pt-44 pb-20 overflow-hidden">
        <div className="absolute right-0 top-0 hidden md:block md:w-1/2 h-full pointer-events-none opacity-40 canvas-fade">
          <FloatingGeometry shape={project.shape} color={project.color} scale={1.1} speed={0.45} />
        </div>
        <div
          className="absolute right-[12%] top-1/2 -translate-y-1/2 w-[460px] h-[460px] pointer-events-none"
          style={{ background: `radial-gradient(circle, ${project.color}1c 0%, transparent 70%)` }}
        />

        <div className="max-w-7xl mx-auto relative z-10">
          <Link
            href="/projects"
            className="group mono text-[11px] text-neutral-400 inline-flex items-center gap-2 mb-10 hover:text-white transition"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> ALL PROJECTS
          </Link>

          <div className="mono text-[11px] tracking-[.2em] mb-4" style={{ color: project.color }}>
            {project.n} · {project.category}
          </div>

          <h1 className="display uppercase text-[13vw] md:text-[8.5vw] leading-[.82] tracking-tight mb-6 max-w-5xl">
            {project.title}
          </h1>

          <p className="text-neutral-200 text-lg md:text-2xl leading-relaxed max-w-2xl mb-8">{project.tagline}</p>

          <div className="flex flex-wrap gap-2 mb-10">
            {project.tech.map((t) => (
              <span
                key={t}
                className="mono text-[10px] px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-300"
              >
                {t}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            {project.demo && (
              <a
                href={project.demo}
                target="_blank"
                rel="noreferrer"
                className="mono text-xs font-semibold bg-[var(--acid)] text-black px-6 py-4 rounded-full flex items-center gap-3 hover:bg-white transition"
              >
                <Play size={15} /> LIVE DEMO
              </a>
            )}
            <a
              href={project.href}
              target="_blank"
              rel="noreferrer"
              className="mono text-xs border border-white/20 px-6 py-4 rounded-full flex items-center gap-3 hover:bg-white hover:text-black transition"
            >
              <ExternalLink size={15} /> GITHUB
            </a>
            <button
              type="button"
              onClick={() => openProjectModal(project)}
              className="mono text-xs border border-white/20 px-6 py-4 rounded-full flex items-center gap-3 text-neutral-300 hover:bg-white hover:text-black transition"
            >
              <Terminal size={15} /> TERMINAL
            </button>
          </div>
        </div>
      </section>

      {/* ── MEDIA ── */}
      <section className="px-5 md:px-10 py-16 md:py-24">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            {/* Live 3D scenes get a taller frame on phones so the scene isn't hidden behind its status panel */}
            <div
              className={`relative rounded-3xl border hairline overflow-hidden bg-black/50 max-h-[560px] ${
                study.media?.scene ? "aspect-[4/5] sm:aspect-[16/9]" : "aspect-[16/9]"
              }`}
            >
              {study.media?.scene === "blood" ? (
                <BloodNetworkScene fallbackImage={study.media.image} />
              ) : study.media?.scene === "solar" ? (
                <SolarRoofScene fallbackImage={study.media.image} />
              ) : study.media?.video ? (
                <video className="w-full h-full object-cover" src={study.media.video} autoPlay muted loop playsInline />
              ) : study.media?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={study.media.image} alt={project.title} className="w-full h-full object-cover" />
              ) : (
                <>
                  <div
                    className="absolute inset-0"
                    style={{ background: `radial-gradient(circle at 50% 55%, ${project.color}1f 0%, transparent 65%)` }}
                  />
                  <FloatingGeometry shape={project.shape} color={project.color} scale={1.5} speed={0.5} />
                  <div className="absolute bottom-5 left-6 mono text-[10px] text-neutral-500">3D PROJECT MODEL</div>
                  <div className="absolute bottom-5 right-6 mono text-[10px]" style={{ color: project.color }}>
                    {project.metrics}
                  </div>
                </>
              )}
            </div>
            {study.media?.caption && (
              <p className="mono text-[11px] text-neutral-500 mt-3">{study.media.caption}</p>
            )}
          </Reveal>
        </div>
      </section>

      {/* ── PROBLEM + SOLUTION ── */}
      <section className="px-5 md:px-10 py-20 md:py-28">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-6">
          <Reveal>
            <TiltCard max={5} className="glass rounded-3xl p-8 md:p-10 h-full stat-card">
              <SectionTitle n="/ 01 — PROBLEM" title="The problem" color="#ff5c5c" />
              <p className="text-neutral-300 text-lg leading-relaxed">{study.problem}</p>
            </TiltCard>
          </Reveal>
          <Reveal delay={0.1}>
            <TiltCard max={5} className="glass rounded-3xl p-8 md:p-10 h-full stat-card">
              <SectionTitle n="/ 02 — SOLUTION" title="The solution" color={project.color} />
              <p className="text-neutral-300 text-lg leading-relaxed">{study.solution}</p>
            </TiltCard>
          </Reveal>
        </div>
      </section>

      {/* ── FLOW ── */}
      <section className="px-5 md:px-10 py-20 md:py-28">
        <div className="max-w-7xl mx-auto">
          <SectionTitle n="/ 03 — HOW IT FLOWS" title="The pipeline" color={project.color} />
          <ol className="flow">
            {study.flow.map((stepName, i) => (
              <li key={stepName} className="flow-step">
                <span className="flow-chip glass">
                  <span className="flow-dot" style={{ background: project.color }} />
                  <span className="mono text-[11px] md:text-xs tracking-wider">{stepName}</span>
                </span>
                {i < study.flow.length - 1 && (
                  <span className="flow-arrow" style={{ color: project.color }} aria-hidden>
                    →
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── HOW I BUILT IT ── */}
      <section className="px-5 md:px-10 py-20 md:py-28">
        <div className="max-w-7xl mx-auto">
          <SectionTitle n="/ 04 — PROCESS" title="How I built it" color={project.color} />
          <ol className="space-y-3">
            {study.build.map((b, i) => (
              <Reveal key={b.step} as="li" delay={i * 0.04}>
                <TiltCard max={4} className="glass rounded-2xl p-6 md:p-7 grid md:grid-cols-[auto_1fr_2fr] gap-4 md:gap-8 items-start">
                  <span className="display text-3xl md:text-4xl" style={{ color: project.color }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-lg md:text-xl font-semibold">{b.step}</h3>
                  <p className="text-neutral-400 leading-relaxed">{b.detail}</p>
                </TiltCard>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ── TECHNOLOGY + FEATURES ── */}
      <section className="px-5 md:px-10 py-20 md:py-28">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-[1fr_1.2fr] gap-10">
          <Reveal>
            <SectionTitle n="/ 05 — TECHNOLOGY" title="Stack" color={project.color} />
            <div className="space-y-3">
              {study.stack.map((s) => (
                <TiltCard key={s.group} max={5} className="glass rounded-2xl p-5">
                  <div className="mono text-[11px] mb-3" style={{ color: project.color }}>
                    {s.group.toUpperCase()}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {s.items.map((t) => (
                      <span
                        key={t}
                        className="mono text-[11px] px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-200"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </TiltCard>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <SectionTitle n="/ 06 — FEATURES" title="Key features" color={project.color} />
            <ul className="grid sm:grid-cols-2 gap-3">
              {study.features.map((f) => (
                <li key={f} className="glass rounded-2xl p-5 flex gap-3 items-start">
                  <CheckCircle2 size={17} className="shrink-0 mt-0.5" style={{ color: project.color }} />
                  <span className="text-sm text-neutral-300 leading-relaxed">{f}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ── CONTRIBUTION + RESULT ── */}
      <section className="px-5 md:px-10 py-20 md:py-28">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-6">
          <Reveal>
            <div className="h-full">
              <SectionTitle n="/ 07 — MY ROLE" title="My contribution" color={project.color} />
              <ul className="space-y-3">
                {study.contribution.map((c) => (
                  <li key={c} className="flex gap-3 items-start text-neutral-300 leading-relaxed">
                    <span className="mono text-[var(--acid)] mt-1">▹</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <TiltCard max={5} className="glass rounded-3xl p-8 md:p-10 h-full border hairline">
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: `linear-gradient(140deg, ${project.color}1a 0%, transparent 60%)` }}
              />
              <div className="relative">
                <SectionTitle n="/ 08 — RESULT" title="Result" color={project.color} />
                <p className="text-xl md:text-2xl text-neutral-100 leading-relaxed">{study.result}</p>
              </div>
            </TiltCard>
          </Reveal>
        </div>
      </section>

      {/* ── NEXT PROJECT ── */}
      <section className="px-5 md:px-10 py-16 md:py-24">
        <div className="max-w-7xl mx-auto">
          <Link
            href={`/projects/${next.slug}`}
            className="group flex flex-col md:flex-row md:items-center justify-between gap-6 rounded-3xl border hairline px-6 md:px-10 py-10 hover:border-[var(--acid)]/40 transition"
          >
            <div>
              <div className="mono text-[11px] text-neutral-500 mb-3">NEXT CASE STUDY</div>
              <div className="display text-4xl md:text-6xl uppercase leading-none group-hover:text-[var(--acid)] transition">
                {next.title}
              </div>
            </div>
            <ArrowRight size={40} className="shrink-0 group-hover:translate-x-2 transition-transform" />
          </Link>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/projects"
              className="mono text-xs border border-white/20 px-6 py-4 rounded-full flex items-center gap-3 hover:bg-white hover:text-black transition"
            >
              ALL PROJECTS <ArrowRight size={15} />
            </Link>
            <Link
              href="/contact"
              className="mono text-xs border border-white/20 px-6 py-4 rounded-full flex items-center gap-3 hover:bg-white hover:text-black transition"
            >
              WORK WITH ME <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
