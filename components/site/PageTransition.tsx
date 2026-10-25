"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { projects } from "../../data/projects";
import { getLenis, prefersReducedMotion } from "../../utils/scroll";

const NAV_EVENT = "shihap:page-transition";
const COLUMNS = 5;

type PageMeta = { label: string; sub: string };

const PAGES: Record<string, PageMeta> = {
  "/": { label: "Home", sub: "01 — Start here" },
  "/about": { label: "About", sub: "02 — Who I am" },
  "/work": { label: "Work", sub: "03 — Skills & craft" },
  "/resume": { label: "Resume", sub: "04 — Official CV" },
  "/contact": { label: "Contact", sub: "05 — Say hello" },
  "/projects": { label: "Projects", sub: "All case studies" },
};

const metaFor = (path: string): PageMeta => {
  if (PAGES[path]) return PAGES[path];
  const slug = path.match(/^\/projects\/([^/]+)/)?.[1];
  const project = slug ? projects.find((p) => p.slug === slug) : undefined;
  if (project) return { label: project.title, sub: `Case study ${project.n}` };
  return { label: "Shihap", sub: "Loading" };
};

/** Cover the screen with the column wipe and the page name, then open `href` behind it. */
export function navigateWithTransition(href: string) {
  window.dispatchEvent(new CustomEvent(NAV_EVENT, { detail: { href } }));
}

/* Page transition: dark columns rise one after another with the destination's name in
   the middle, the next page loads behind them, then they lift away. Every internal link
   to another page goes through it; a page opened directly still gets the lift-away. */
export default function PageTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const root = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const sub = useRef<HTMLSpanElement>(null);
  const covered = useRef(false);
  const busy = useRef(false);
  const shownPath = useRef<string | null>(null);
  const revealTl = useRef<gsap.core.Timeline | null>(null);

  const columns = () => Array.from(root.current?.querySelectorAll<HTMLElement>(".pt-col") ?? []);
  const texts = () => [label.current, sub.current].filter(Boolean) as HTMLElement[];

  const setMeta = (path: string) => {
    const meta = metaFor(path);
    if (label.current) {
      label.current.textContent = meta.label;
      label.current.classList.toggle("is-long", meta.label.length > 12);
    }
    if (sub.current) sub.current.textContent = meta.sub;
  };

  // Opening animation for whichever page just mounted. Keyed on the path actually changing,
  // so React's development double-run neither replays it nor cancels it halfway.
  useLayoutEffect(() => {
    const el = root.current;
    const previous = shownPath.current;
    if (previous === pathname) return;
    shownPath.current = pathname;
    if (!el || prefersReducedMotion() || (previous === null && pathname === "/")) {
      busy.current = false;
      return;
    }
    revealTl.current?.kill();

    if (!covered.current) {
      // Arrived without a cover (a fresh load): start covered so nothing flashes
      setMeta(pathname);
      gsap.set(el, { visibility: "visible", pointerEvents: "auto" });
      gsap.set(columns(), { yPercent: 0 });
      gsap.set(texts(), { yPercent: 0, opacity: 1 });
    }

    revealTl.current = gsap
      .timeline({
        delay: 0.35,
        onComplete: () => {
          gsap.set(el, { visibility: "hidden", pointerEvents: "none" });
          covered.current = false;
          busy.current = false;
          getLenis()?.start();
        },
      })
      .to(texts(), { yPercent: -80, opacity: 0, duration: 0.35, stagger: 0.05, ease: "power2.in" })
      .to(columns(), { yPercent: -112, duration: 0.75, stagger: 0.07, ease: "power3.inOut" }, "-=0.15");
  }, [pathname]);

  // Cover first, then navigate
  useEffect(() => {
    const onNavigate = (e: Event) => {
      const { href } = (e as CustomEvent<{ href: string }>).detail;
      const url = new URL(href, window.location.href);
      const el = root.current;

      if (url.pathname === pathname) {
        // Already here: just glide back to the top
        const lenis = getLenis();
        if (lenis) lenis.scrollTo(0, { duration: 1.2 });
        else window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (!el || prefersReducedMotion()) {
        router.push(href);
        return;
      }
      if (busy.current) return;
      busy.current = true;
      covered.current = true;
      getLenis()?.stop();
      setMeta(url.pathname);
      gsap.set(el, { visibility: "visible", pointerEvents: "auto" });
      gsap
        .timeline({ onComplete: () => router.push(href) })
        .fromTo(columns(), { yPercent: 112 }, { yPercent: 0, duration: 0.7, stagger: 0.07, ease: "power3.inOut" })
        .fromTo(
          texts(),
          { yPercent: 80, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: "power3.out" },
          0.4
        );
    };
    window.addEventListener(NAV_EVENT, onNavigate);
    return () => window.removeEventListener(NAV_EVENT, onNavigate);
  }, [pathname, router]);

  // Every ordinary internal link to a different page opens through the transition
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.("a");
      if (!link || link.dataset.pt === "off" || link.hasAttribute("download")) return;
      if (link.target && link.target !== "_self") return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      e.preventDefault();
      e.stopPropagation();
      navigateWithTransition(url.pathname + url.search + url.hash);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return (
    <div ref={root} className="pt" aria-hidden>
      {Array.from({ length: COLUMNS }, (_, i) => (
        <span key={i} className="pt-col" />
      ))}
      <span className="pt-text">
        <span ref={label} className="pt-label display" />
        <span ref={sub} className="pt-sub mono" />
      </span>
    </div>
  );
}
