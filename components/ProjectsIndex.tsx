"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import TiltCard from "./TiltCard";
import Reveal from "./Reveal";
import { projects } from "../data/projects";
import { profile } from "../data/site";

const FloatingGeometry = dynamic(() => import("./FloatingGeometry"), { ssr: false });

export default function ProjectsIndex() {
  return (
    <main className="relative selection:bg-[var(--acid)] selection:text-black">
      <section id="top" className="relative px-5 md:px-10 pt-36 md:pt-44 pb-16 overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="mono text-xs text-neutral-500 mb-6 flex items-center gap-3">
            <span>/ 03 — PROJECTS</span>
            <span className="h-px bg-neutral-800 w-16" />
          </div>
          <h1 className="display uppercase text-[16vw] md:text-[11vw] leading-[.8] tracking-tight mb-8">
            CASE
            <br />
            <span className="text-transparent" style={{ WebkitTextStroke: "1.5px #f2f2f0" }}>
              STUDIES.
            </span>
          </h1>
          <p className="text-neutral-300 text-base md:text-xl leading-relaxed max-w-2xl">
            Each project gets its own page: the problem, the solution, how I built it, the technology, the key
            features, my contribution and the result.
          </p>
        </div>
      </section>

      <section className="px-5 md:px-10 py-20 md:py-28">
        <div className="max-w-7xl mx-auto space-y-6">
          {projects.map((project, i) => (
            <Reveal key={project.slug} delay={i * 0.06}>
              <TiltCard max={4} className="project-tile glass rounded-3xl">
                <Link href={`/projects/${project.slug}`} className="group grid md:grid-cols-[1fr_1.4fr] min-h-[280px]">
                  <div
                    className="relative min-h-[220px] border-b md:border-b-0 md:border-r hairline overflow-hidden"
                    style={{ background: `radial-gradient(circle at 50% 50%, ${project.color}16 0%, transparent 70%)` }}
                  >
                    <FloatingGeometry shape={project.shape} color={project.color} scale={2.1} speed={0.55} />
                    <div className="absolute top-4 left-5 mono text-[10px]" style={{ color: project.color }}>
                      {project.metrics}
                    </div>
                  </div>

                  <div className="p-7 md:p-10 flex flex-col">
                    <div className="flex items-center justify-between gap-4 mb-3">
                      <span className="mono text-[10px] tracking-[.2em]" style={{ color: project.color }}>
                        {project.n} · {project.category}
                      </span>
                      <ArrowUpRight
                        size={20}
                        className="text-neutral-500 group-hover:text-[var(--acid)] group-hover:rotate-45 transition"
                      />
                    </div>

                    <h2 className="display text-4xl md:text-6xl uppercase leading-[.88] mb-4">{project.title}</h2>
                    <p className="text-neutral-300 leading-relaxed mb-5 max-w-xl">{project.tagline}</p>

                    <div className="flex flex-wrap gap-2 mb-6">
                      {project.tech.map((t) => (
                        <span
                          key={t}
                          className="mono text-[10px] px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-300"
                        >
                          {t}
                        </span>
                      ))}
                    </div>

                    <span className="mono text-[11px] text-neutral-400 mt-auto flex items-center gap-2 group-hover:text-white transition">
                      READ CASE STUDY <ArrowRight size={14} />
                    </span>
                  </div>
                </Link>
              </TiltCard>
            </Reveal>
          ))}

          <Link
            href="/contact"
            className="group flex items-center justify-between gap-6 rounded-3xl border border-[var(--acid)]/30 bg-[var(--acid)]/[0.04] px-6 md:px-10 py-9 hover:bg-[var(--acid)] hover:text-black transition"
          >
            <span>
              <span className="display text-3xl md:text-5xl uppercase leading-none block">Have an idea?</span>
              <span className="mono text-[11px] opacity-70">{profile.email}</span>
            </span>
            <ArrowRight size={34} className="shrink-0 group-hover:translate-x-2 transition-transform" />
          </Link>
        </div>
      </section>
    </main>
  );
}
