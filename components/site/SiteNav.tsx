"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import gsap from "gsap";
import { ArrowUpRight, Gamepad2 } from "lucide-react";
import { useGame } from "../../context/GameContext";
import { navLinks, profile, type NavLink } from "../../data/site";
import { prefersReducedMotion } from "../../utils/scroll";
import { sound } from "../../utils/soundFx";
import { navigateWithTransition } from "./PageTransition";
import { useIstClock } from "./useIstClock";

export default function SiteNav() {
  const pathname = usePathname();
  const { soundEnabled, toggleSound, setGameMode } = useGame();
  const time = useIstClock();

  const [open, setOpen] = useState(false);
  const menuId = useId();
  const drop = useRef<HTMLDivElement>(null);
  const burger = useRef<HTMLButtonElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);

  // A small dropdown under the three-line button: it folds open and the links rise in one by one
  useEffect(() => {
    const el = drop.current;
    if (!el) return;
    const reduced = prefersReducedMotion();
    gsap.set(el, { clipPath: "inset(0% 0% 100% 0% round 22px)", visibility: "hidden" });
    tl.current = gsap
      .timeline({ paused: true })
      .set(el, { visibility: "visible" })
      .to(el, { clipPath: "inset(0% 0% 0% 0% round 22px)", duration: reduced ? 0.01 : 0.6, ease: "power4.inOut" })
      .fromTo(
        el.querySelectorAll(".nav-drop__link .split-inner"),
        { yPercent: 110 },
        { yPercent: 0, duration: reduced ? 0.01 : 0.6, stagger: 0.06, ease: "expo.out" },
        "-=0.3"
      )
      .fromTo(
        el.querySelectorAll(".nav-drop__foot > *"),
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: "power3.out" },
        "<0.15"
      );
    return () => {
      // revert (not kill) so a remount doesn't inherit the hidden start state
      tl.current?.revert();
      tl.current = null;
    };
  }, []);

  useEffect(() => {
    if (!tl.current) return;
    if (open) tl.current.timeScale(1).play();
    else tl.current.timeScale(1.8).reverse();
  }, [open]);

  // Close with Escape or a click anywhere outside the dropdown
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        burger.current?.focus();
      }
    };
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!drop.current?.contains(target) && !burger.current?.contains(target)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  // Every item opens its own page behind the column transition
  const go = (link: NavLink) => (e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(false);
    navigateWithTransition(link.href);
  };

  const hoverBlip = () => {
    if (soundEnabled) sound.playBlip(880, 0.03);
  };

  return (
    <>
      <header className="site-nav">
        <Link href="/" className="nav-logo" onClick={() => setOpen(false)}>
          <span className="nav-mark" aria-hidden>
            <i />
            <i />
          </span>
          {profile.name}
        </Link>

        <div className="nav-available" aria-label={profile.available}>
          <span className="nav-available__dot" />
          {profile.available}
        </div>

        <div className="nav-right">
          <button type="button" className="nav-sound" onClick={toggleSound} aria-pressed={soundEnabled}>
            Sound <span className="opacity-40">|</span> <b>{soundEnabled ? "ON" : "OFF"}</b>
          </button>
          {time && <span className="nav-clock">{time} IST</span>}
          <button
            ref={burger}
            type="button"
            className={`nav-burger ${open ? "is-open" : ""}`}
            aria-expanded={open}
            aria-controls={menuId}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <div ref={drop} id={menuId} className="nav-drop">
        <nav aria-label="Main">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="nav-drop__link"
              onClick={go(link)}
              onMouseEnter={hoverBlip}
              data-pt="off"
              aria-current={pathname === link.href ? "page" : undefined}
            >
              <span className="nav-drop__n mono">{link.n}</span>
              <span className="split-mask">
                <span className="split-inner">{link.label}</span>
              </span>
              <ArrowUpRight size={18} className="nav-drop__arrow" aria-hidden />
            </Link>
          ))}
        </nav>
        <div className="nav-drop__foot">
          <button
            type="button"
            className="nav-drop__play"
            onClick={() => {
              setOpen(false);
              window.setTimeout(() => setGameMode("game"), 250);
            }}
          >
            <Gamepad2 size={15} /> Play the 3D game
          </button>
          <div className="nav-drop__social">
            <a href={profile.github} target="_blank" rel="noreferrer">
              GitHub
            </a>
            <a href={profile.linkedin} target="_blank" rel="noreferrer">
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
