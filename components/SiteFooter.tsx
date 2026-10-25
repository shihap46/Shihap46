"use client";

import Link from "next/link";
import { ArrowUp } from "lucide-react";
import ReplayIntroButton from "./ReplayIntroButton";
import { useIstClock } from "./site/useIstClock";
import { academic, profile } from "../data/site";
import { getLenis } from "../utils/scroll";

/* Shared footer: local time, year, studies, a back-to-top button and social links. */
export default function SiteFooter() {
  const time = useIstClock();

  const toTop = () => {
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(0, { duration: 1.4 });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="site-footer">
      <div className="sf-grid">
        <div>
          <p className="sf-k">Local time</p>
          <p className="sf-v">{time ? `${time} IST` : "—"}</p>
        </div>
        <div>
          <p className="sf-k">Version</p>
          <p className="sf-v">© 2026</p>
        </div>
        <div>
          <p className="sf-k">Studying</p>
          <p className="sf-v">
            {academic.short.replace("B.TECH", "B.Tech")} · {academic.college}
          </p>
        </div>
        <div className="sf-made">
          <button type="button" className="sf-up" onClick={toTop} aria-label="Back to top" data-cursor="link">
            <ArrowUp size={18} />
          </button>
          <p className="sf-v">Made by {profile.name}</p>
        </div>
        <div className="sf-soc">
          <p className="sf-k">Social media</p>
          <div className="sf-links">
            <a href={profile.github} target="_blank" rel="noreferrer">
              GitHub
            </a>
            <a href={profile.linkedin} target="_blank" rel="noreferrer">
              LinkedIn
            </a>
            <a href={`mailto:${profile.email}`}>Email</a>
          </div>
        </div>
      </div>
      <div className="sf-mini mono">
        <Link href="/about">About</Link>
        <Link href="/work">Work</Link>
        <Link href="/projects">Case studies</Link>
        <Link href="/resume">Résumé</Link>
        <Link href="/contact">Contact</Link>
        <ReplayIntroButton />
      </div>
    </footer>
  );
}
