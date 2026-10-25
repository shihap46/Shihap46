"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Terminal } from "lucide-react";
import { useGame } from "../context/GameContext";
import { featuredProject as project } from "../data/projects";

const FloatingGeometry = dynamic(() => import("./FloatingGeometry"), { ssr: false });

const EASE = [0.16, 1, 0.3, 1] as const;

// The flagship project (Real-Time Blood Donor Network) with its 3D model — used on Home and Work
export default function FeaturedProject() {
  const { openProjectModal } = useGame();

  return (
    <div className="grid lg:grid-cols-[1.1fr_1fr] gap-8 items-stretch">
      <motion.div
        initial={{ opacity: 0, y: 36 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.7, ease: EASE }}
        className="relative min-h-[320px] md:min-h-[420px] rounded-3xl border hairline bg-black/40 overflow-hidden"
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(circle at 50% 50%, ${project.color}1f 0%, transparent 65%)` }}
        />
        <FloatingGeometry shape={project.shape} color={project.color} scale={2.1} speed={0.6} />
        <div className="absolute top-5 left-5 mono text-[10px] flex items-center gap-2" style={{ color: project.color }}>
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: project.color }} />
          {project.metrics}
        </div>
        <div className="absolute bottom-5 right-5 mono text-[10px] text-neutral-500">3D PROJECT MODEL</div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 36 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
        className="flex flex-col justify-center"
      >
        <div className="mono text-[10px] tracking-[.2em] uppercase mb-3" style={{ color: project.color }}>
          {project.n} · FLAGSHIP · {project.category}
        </div>
        <h3 className="display text-5xl md:text-7xl uppercase leading-[.85] mb-5">{project.title}</h3>
        <p className="mono text-xs text-[var(--acid)] mb-5">A SAMPLE OF MY CREATIVE THINKING</p>
        <p className="text-neutral-300 leading-relaxed mb-6">{project.desc}</p>
        <div className="flex flex-wrap gap-2 mb-8">
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
          <Link
            href={`/projects/${project.slug}`}
            className="mono text-xs font-semibold bg-[var(--acid)] text-black px-6 py-4 rounded-full flex items-center gap-3 hover:bg-white transition"
          >
            READ CASE STUDY <ArrowRight size={16} />
          </Link>
          <button
            type="button"
            onClick={() => openProjectModal(project)}
            className="mono text-xs border border-white/20 px-6 py-4 rounded-full flex items-center gap-3 hover:bg-white hover:text-black transition"
          >
            <Terminal size={16} /> TERMINAL
          </button>
          <a
            href={project.href}
            target="_blank"
            rel="noreferrer"
            className="mono text-xs border border-white/20 px-6 py-4 rounded-full flex items-center gap-3 hover:bg-white hover:text-black transition"
          >
            VIEW REPO <ArrowUpRight size={16} />
          </a>
        </div>
      </motion.div>
    </div>
  );
}
