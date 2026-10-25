"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useGame } from "../context/GameContext";
import { X, ExternalLink, Cpu, CheckCircle2 } from "lucide-react";
import dynamic from "next/dynamic";

const FloatingGeometry = dynamic(() => import("./FloatingGeometry"), {
  ssr: false,
});

export default function ProjectModal() {
  const { activeProjectModal, closeProjectModal } = useGame();

  useEffect(() => {
    if (!activeProjectModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeProjectModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeProjectModal, closeProjectModal]);

  if (!activeProjectModal) return null;

  const shapeType =
    activeProjectModal.title.includes("SOLAR")
      ? "torusKnot"
      : activeProjectModal.title.includes("BLOOD")
      ? "octahedron"
      : "dodecahedron";

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-[#0a0a0a] border border-[var(--acid)] rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(167,139,250,0.15)] overflow-hidden">
        {/* Ambient Top Glow Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[var(--acid)] to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-white/10 mb-6">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--acid)] animate-pulse" />
            <span className="mono text-xs text-[var(--acid)] tracking-widest uppercase">
              TERMINAL // {activeProjectModal.category}
            </span>
          </div>
          <button
            onClick={closeProjectModal}
            className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-neutral-400 hover:text-white hover:border-white transition"
            aria-label="Close Project Modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* 3D Wireframe Preview Box */}
        <div className="relative h-40 w-full rounded-2xl bg-neutral-950 border border-white/5 mb-6 overflow-hidden flex items-center justify-center">
          <FloatingGeometry
            shape={shapeType}
            color={activeProjectModal.color || "#a78bfa"}
            scale={2}
            speed={0.8}
          />
          <div className="absolute bottom-2.5 left-4 mono text-[10px] text-neutral-400 flex items-center gap-1.5">
            <Cpu size={12} className="text-[var(--acid)]" /> 3D TELEMETRY MODEL
          </div>
          <div className="absolute bottom-2.5 right-4 mono text-[10px] text-[var(--acid)]">
            {activeProjectModal.metrics}
          </div>
        </div>

        {/* Project Title & Tag */}
        <div className="mb-4">
          <div className="mono text-[10px] text-neutral-400 tracking-wider mb-1">
            {activeProjectModal.tag}
          </div>
          <h3 className="display text-3xl md:text-4xl uppercase text-white tracking-tight">
            {activeProjectModal.title}
          </h3>
        </div>

        {/* Description */}
        <p className="text-neutral-300 text-sm md:text-base leading-relaxed mb-6">
          {activeProjectModal.desc}
        </p>

        {/* Tech Stack Chips */}
        <div className="mb-8">
          <div className="mono text-[10px] text-neutral-400 mb-2">SYSTEM ARCHITECTURE & TOOLS:</div>
          <div className="flex flex-wrap gap-2">
            {activeProjectModal.tech.map((t) => (
              <span
                key={t}
                className="mono text-xs px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-200 flex items-center gap-1.5"
              >
                <CheckCircle2 size={12} className="text-[var(--acid)]" />
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10">
          <span className="mono text-[11px] text-neutral-400">
            DOCKING STATUS: <span className="text-[var(--acid)]">SYNCHRONIZED</span>
          </span>
          <div className="flex gap-3">
            <button
              onClick={closeProjectModal}
              className="mono text-xs px-5 py-2.5 rounded-full border border-white/20 text-neutral-300 hover:text-white hover:border-white transition"
            >
              CLOSE
            </button>
            {activeProjectModal.slug && (
              <Link
                href={`/projects/${activeProjectModal.slug}`}
                onClick={closeProjectModal}
                data-pt="off"
                className="mono text-xs px-5 py-2.5 rounded-full border border-[var(--acid)]/50 text-[var(--acid)] hover:bg-[var(--acid)] hover:text-black transition"
              >
                READ CASE STUDY
              </Link>
            )}
            <a
              href={activeProjectModal.href}
              target="_blank"
              rel="noreferrer"
              className="mono text-xs px-5 py-2.5 rounded-full bg-[var(--acid)] text-black font-semibold flex items-center gap-2 hover:bg-white transition"
            >
              VIEW REPO <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
