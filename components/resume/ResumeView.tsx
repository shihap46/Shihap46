"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  Download,
  ExternalLink,
  Copy,
  Check,
  Mail,
  Phone,
  MapPin,
  Building2,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Code2,
  Brain,
  Globe,
  Wrench,
  GraduationCap,
  FileText,
  Eye,
  Layers,
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import SplitText from "../site/SplitText";
import { profile, academic, internships, summary, areasOfInterest, languages } from "../../data/site";
import { projects } from "../../data/projects";
import { prefersReducedMotion } from "../../utils/scroll";

gsap.registerPlugin(useGSAP);

const ENTER_DELAY = 1.05;

export default function ResumeView() {
  const root = useRef<HTMLElement>(null);
  const [activeTab, setActiveTab] = useState<"interactive" | "pdf">("interactive");
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const copyEmail = () => {
    navigator.clipboard.writeText(profile.email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const copyPhone = () => {
    navigator.clipboard.writeText(profile.phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

      gsap.from(".res-in", {
        y: 30,
        opacity: 0,
        duration: 1,
        stagger: 0.08,
        ease: "expo.out",
        delay: ENTER_DELAY + 0.15,
      });

      gsap.from(".res-card", {
        y: 45,
        opacity: 0,
        duration: 0.9,
        stagger: 0.06,
        ease: "expo.out",
        delay: ENTER_DELAY + 0.35,
      });
    },
    { scope: root }
  );

  return (
    <main ref={root} className="min-h-screen pt-36 md:pt-44 pb-28 px-5 md:px-12 selection:bg-[var(--acid)] selection:text-black">
      <div className="max-w-6xl mx-auto">
        {/* ─── Eyebrow & Main Title ─── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-white/10 pb-10">
          <div>
            <p className="mono text-xs text-[var(--acid)] mb-3 tracking-wider flex items-center gap-2 res-in">
              <span className="w-2 h-2 rounded-full bg-[var(--acid)] animate-pulse" />
              / 04 — CURRICULUM VITAE
            </p>
            <h1 className="display text-6xl sm:text-7xl md:text-8xl tracking-tight text-white mb-4">
              <SplitText text="RÉSUMÉ" by="chars" immediate delay={ENTER_DELAY} />
            </h1>
            <p className="mono text-xs sm:text-sm text-neutral-400 max-w-xl leading-relaxed res-in">
              {profile.fullName} &bull; {profile.subRole}
            </p>
          </div>

          {/* ─── Top Action Bar ─── */}
          <div className="flex flex-wrap items-center gap-3 res-in">
            <a
              href="/resume.pdf"
              download={`${profile.fullName.replace(/\s+/g, "_")}_Resume.pdf`}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white text-black font-semibold text-xs tracking-wider uppercase hover:bg-[var(--acid)] transition-colors shadow-lg cursor-pointer"
              data-cursor="link"
            >
              <Download size={15} />
              <span>Download PDF</span>
            </a>

            <a
              href="/resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-full glass text-neutral-200 hover:text-white hover:border-white/30 text-xs tracking-wider uppercase transition cursor-pointer"
              data-cursor="link"
              title="Open raw PDF in new browser tab"
            >
              <ExternalLink size={15} />
              <span>Open PDF</span>
            </a>

            <div className="flex items-center rounded-full glass p-1">
              <button
                type="button"
                onClick={() => setActiveTab("interactive")}
                className={`px-4 py-2 rounded-full text-xs font-mono transition flex items-center gap-1.5 ${
                  activeTab === "interactive" ? "bg-white/15 text-white font-bold" : "text-neutral-400 hover:text-white"
                }`}
              >
                <Layers size={13} />
                <span>Interactive</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("pdf")}
                className={`px-4 py-2 rounded-full text-xs font-mono transition flex items-center gap-1.5 ${
                  activeTab === "pdf" ? "bg-white/15 text-white font-bold" : "text-neutral-400 hover:text-white"
                }`}
              >
                <FileText size={13} />
                <span>PDF Document</span>
              </button>
            </div>
          </div>
        </div>

        {/* ─── TAB 1: INTERACTIVE VIEW ─── */}
        {activeTab === "interactive" ? (
          <div className="space-y-12">
            {/* Quick Contact & Status Strip */}
            <div className="res-card glass rounded-2xl p-6 md:p-8 flex flex-wrap items-center justify-between gap-6 border border-white/10">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
                  <span className="mono text-xs uppercase tracking-wider text-emerald-400 font-semibold">
                    Seeking Software Development Internship
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white tracking-wide">{profile.fullName}</h2>
                <p className="text-neutral-400 text-sm">{academic.status} &bull; {academic.college}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={copyEmail}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg glass text-xs text-neutral-300 hover:text-white hover:border-white/30 transition cursor-pointer"
                  title="Copy email to clipboard"
                >
                  {copiedEmail ? <Check size={14} className="text-emerald-400" /> : <Mail size={14} />}
                  <span>{copiedEmail ? "Copied Email!" : profile.email}</span>
                  {!copiedEmail && <Copy size={11} className="opacity-40" />}
                </button>

                <button
                  type="button"
                  onClick={copyPhone}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg glass text-xs text-neutral-300 hover:text-white hover:border-white/30 transition cursor-pointer"
                  title="Copy phone to clipboard"
                >
                  {copiedPhone ? <Check size={14} className="text-emerald-400" /> : <Phone size={14} />}
                  <span>{copiedPhone ? "Copied Phone!" : profile.phone}</span>
                  {!copiedPhone && <Copy size={11} className="opacity-40" />}
                </button>

                <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-neutral-900/60 text-xs text-neutral-400 border border-white/5">
                  <MapPin size={13} className="text-[var(--acid)]" />
                  <span>{profile.location}</span>
                </div>

                <a
                  href={profile.github}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg glass text-xs text-neutral-300 hover:text-white hover:border-white/30 transition"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                    <path d="M9 18c-4.51 2-5-2-7-2" />
                  </svg>
                  <span>github.com/shihap46</span>
                  <ExternalLink size={11} className="opacity-50" />
                </a>
              </div>
            </div>

            {/* ─── Professional Summary ─── */}
            <section className="res-card glass rounded-2xl p-6 md:p-8 border border-white/10 space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono text-[var(--acid)] uppercase tracking-wider">
                <Sparkles size={14} />
                <span>Professional Summary</span>
              </div>
              <p className="text-neutral-200 text-base md:text-lg leading-relaxed font-light">
                {summary}
              </p>
            </section>

            {/* ─── Two-Column Section: Experience & Education ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Internship Experience */}
              <section className="lg:col-span-7 space-y-6">
                <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 uppercase tracking-wider mb-2">
                  <Building2 size={15} className="text-[var(--acid)]" />
                  <span>Internship Experience</span>
                </div>

                <div className="space-y-4">
                  {internships.map((intern, i) => (
                    <article
                      key={intern.role + i}
                      className="res-card glass rounded-2xl p-6 md:p-7 border border-white/10 hover:border-white/25 transition space-y-4 relative group"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div>
                          <h3 className="text-xl font-bold text-white group-hover:text-[var(--acid)] transition-colors">
                            {intern.role}
                          </h3>
                          <p className="text-neutral-300 text-sm font-medium mt-0.5">{intern.company}</p>
                        </div>
                        <span className="mono text-xs px-3 py-1 rounded-full bg-white/10 text-neutral-300 self-start sm:self-auto border border-white/10">
                          {intern.period}
                        </span>
                      </div>

                      <ul className="space-y-2 pt-2 border-t border-white/5">
                        {intern.bullets.map((bullet, idx) => (
                          <li key={idx} className="text-sm text-neutral-300 flex items-start gap-2.5 leading-relaxed">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--acid)] mt-2 shrink-0" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              </section>

              {/* Right Column: Education & Credentials */}
              <section className="lg:col-span-5 space-y-6">
                <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 uppercase tracking-wider mb-2">
                  <GraduationCap size={16} className="text-[var(--acid)]" />
                  <span>Education</span>
                </div>

                <div className="res-card glass rounded-2xl p-6 md:p-7 border border-white/10 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="mono text-xs px-3 py-1 rounded-full bg-white/10 text-[var(--acid)] border border-white/10">
                      {academic.status}
                    </span>
                    <span className="mono text-xs text-neutral-400">{academic.start} — {academic.end}</span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white">{academic.degree}</h3>
                    <p className="text-neutral-300 text-sm mt-1">{academic.college}</p>
                    <p className="mono text-xs text-neutral-400 mt-2 flex items-center gap-1.5">
                      <MapPin size={12} /> Coimbatore / Tamil Nadu, India
                    </p>
                  </div>
                </div>

                {/* Areas of Interest */}
                <div className="res-card glass rounded-2xl p-6 border border-white/10 space-y-3">
                  <p className="mono text-xs uppercase tracking-wider text-neutral-400">Areas of Interest</p>
                  <div className="flex flex-wrap gap-2">
                    {areasOfInterest.map((interest) => (
                      <span
                        key={interest}
                        className="px-3 py-1 rounded-full text-xs font-mono bg-white/5 text-neutral-200 border border-white/10"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Languages */}
                <div className="res-card glass rounded-2xl p-6 border border-white/10 space-y-3">
                  <p className="mono text-xs uppercase tracking-wider text-neutral-400">Languages</p>
                  <div className="flex items-center gap-3">
                    {languages.map((lang) => (
                      <span
                        key={lang}
                        className="px-3.5 py-1.5 rounded-full text-xs font-mono bg-neutral-900/80 text-white border border-white/15 flex items-center gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              </section>
            </div>

            {/* ─── Technical & Professional Skills ─── */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 uppercase tracking-wider">
                  <Code2 size={16} className="text-[var(--acid)]" />
                  <span>Technical &amp; Professional Skills</span>
                </div>
                <span className="mono text-xs text-neutral-400">Directly from Resume</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Programming Languages */}
                <div className="res-card glass rounded-2xl p-6 border border-white/10 space-y-3">
                  <div className="flex items-center gap-2 text-white font-semibold text-sm">
                    <Code2 size={16} className="text-amber-400" />
                    <h4>Programming Languages</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["C", "C++", "Python", "Java"].map((skill) => (
                      <span key={skill} className="px-3 py-1.5 rounded-lg text-xs font-mono bg-white/10 text-white border border-white/10 font-bold">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Web Technologies */}
                <div className="res-card glass rounded-2xl p-6 border border-white/10 space-y-3">
                  <div className="flex items-center gap-2 text-white font-semibold text-sm">
                    <Globe size={16} className="text-cyan-400" />
                    <h4>Web Technologies</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["HTML", "CSS", "JavaScript", "React", "Next.js"].map((skill) => (
                      <span key={skill} className="px-3 py-1.5 rounded-lg text-xs font-mono bg-white/10 text-white border border-white/10">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* AI and Data */}
                <div className="res-card glass rounded-2xl p-6 border border-white/10 space-y-3">
                  <div className="flex items-center gap-2 text-white font-semibold text-sm">
                    <Brain size={16} className="text-purple-400" />
                    <h4>AI and Data</h4>
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    Fundamentals of artificial intelligence, machine learning, and data analysis.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {["Artificial Intelligence", "Machine Learning", "Data Analysis", "OpenCV"].map((skill) => (
                      <span key={skill} className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-white/5 text-purple-200 border border-purple-500/20">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tools */}
                <div className="res-card glass rounded-2xl p-6 border border-white/10 space-y-3">
                  <div className="flex items-center gap-2 text-white font-semibold text-sm">
                    <Wrench size={16} className="text-rose-400" />
                    <h4>Tools &amp; Workflow</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["Git", "GitHub", "Microsoft Word", "Microsoft PowerPoint"].map((skill) => (
                      <span key={skill} className="px-3 py-1.5 rounded-lg text-xs font-mono bg-white/10 text-white border border-white/10">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Professional Skills */}
                <div className="res-card glass rounded-2xl p-6 border border-white/10 space-y-3 md:col-span-2">
                  <div className="flex items-center gap-2 text-white font-semibold text-sm">
                    <Sparkles size={16} className="text-emerald-400" />
                    <h4>Professional Skills</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Problem-solving",
                      "Teamwork",
                      "Communication",
                      "Presentation",
                      "Research and analysis",
                    ].map((skill) => (
                      <span key={skill} className="px-3 py-1.5 rounded-lg text-xs font-mono bg-white/5 text-neutral-200 border border-white/10">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* ─── Project Concepts Section (Matching Resume) ─── */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 uppercase tracking-wider">
                  <Layers size={16} className="text-[var(--acid)]" />
                  <span>Featured Project Concepts</span>
                </div>
                <Link href="/projects" className="mono text-xs text-[var(--acid)] hover:underline flex items-center gap-1">
                  View Full Case Studies <ArrowUpRight size={13} />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {projects.slice(0, 3).map((proj) => (
                  <article
                    key={proj.slug}
                    className="res-card glass rounded-2xl p-6 border border-white/10 flex flex-col justify-between hover:border-white/30 transition group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="mono text-xs text-[var(--acid)] font-bold">{proj.n}</span>
                        <span className="mono text-[10px] text-neutral-400 uppercase tracking-wider">{proj.category}</span>
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[var(--acid)] transition-colors">
                        {proj.title}
                      </h3>
                      <p className="text-xs text-neutral-300 leading-relaxed mb-4">{proj.desc}</p>
                    </div>

                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                      <div className="flex flex-wrap gap-1.5">
                        {proj.tech.slice(0, 3).map((t) => (
                          <span key={t} className="mono text-[10px] px-2 py-0.5 rounded bg-white/5 text-neutral-400">
                            {t}
                          </span>
                        ))}
                      </div>
                      <Link
                        href={`/projects/${proj.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-mono text-white hover:text-[var(--acid)] transition"
                      >
                        <span>Study</span>
                        <ArrowUpRight size={13} />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* ─── Bottom CTA Banner ─── */}
            <section className="res-card glass rounded-3xl p-8 md:p-12 border border-white/15 text-center space-y-6 relative overflow-hidden">
              <div className="max-w-xl mx-auto space-y-3">
                <p className="mono text-xs text-[var(--acid)] uppercase tracking-wider">Interested in working together?</p>
                <h3 className="display text-4xl sm:text-5xl text-white">Let&apos;s Build Something Practical</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">
                  Available for software development internships, AI projects, and collaborative engineering.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <Link
                  href="/contact"
                  className="px-6 py-3.5 rounded-full bg-white text-black font-semibold text-xs tracking-wider uppercase hover:bg-[var(--acid)] transition shadow-lg cursor-pointer inline-flex items-center gap-2"
                >
                  <span>Contact Shihapdeen</span>
                  <ArrowUpRight size={15} />
                </Link>

                <a
                  href="/resume.pdf"
                  download="Shihapdeen_Resume.pdf"
                  className="px-6 py-3.5 rounded-full glass text-white hover:border-white/40 font-semibold text-xs tracking-wider uppercase transition inline-flex items-center gap-2 cursor-pointer"
                >
                  <Download size={15} />
                  <span>Download Résumé PDF</span>
                </a>
              </div>
            </section>
          </div>
        ) : (
          /* ─── TAB 2: EMBEDDED PDF DOCUMENT VIEWER ─── */
          <div className="space-y-6">
            <div className="glass rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 border border-white/10">
              <div className="flex items-center gap-3">
                <FileText className="text-[var(--acid)]" size={20} />
                <div>
                  <h3 className="text-sm font-semibold text-white">SHIHAPDEEN S. — Official Resume PDF</h3>
                  <p className="mono text-xs text-neutral-400">Vector PDF &bull; Ready for print &amp; download</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href="/resume.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full glass text-xs text-neutral-200 hover:text-white transition"
                >
                  <ExternalLink size={13} />
                  <span>Open Fullscreen</span>
                </a>
                <a
                  href="/resume.pdf"
                  download="Shihapdeen_Resume.pdf"
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[var(--acid)] text-black font-semibold text-xs transition hover:brightness-110"
                >
                  <Download size={13} />
                  <span>Download</span>
                </a>
              </div>
            </div>

            {/* Embedded PDF iframe */}
            <div className="w-full rounded-2xl overflow-hidden border border-white/15 bg-neutral-900 shadow-2xl relative" style={{ height: "85vh", minHeight: "700px" }}>
              <iframe
                src="/resume.pdf#view=FitH"
                title="Shihapdeen S. Resume"
                className="w-full h-full border-0"
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
