"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/* Small dot + trailing ring. The ring changes shape by what's under it:
   links grow it, [data-cursor="view"] shows a VIEW label, [data-cursor="image"]
   becomes a large lens, text fields turn it into a caret. Fine pointers only. */

type CursorState = "" | "link" | "view" | "image" | "text" | "hide";

export default function CustomCursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const d = dot.current;
    const r = ring.current;
    const l = label.current;
    if (!d || !r || !l) return;

    document.documentElement.classList.add("has-cursor");

    const dotX = gsap.quickTo(d, "x", { duration: 0.08, ease: "power3" });
    const dotY = gsap.quickTo(d, "y", { duration: 0.08, ease: "power3" });
    const ringX = gsap.quickTo(r, "x", { duration: 0.42, ease: "power3" });
    const ringY = gsap.quickTo(r, "y", { duration: 0.42, ease: "power3" });

    let state: CursorState = "";
    const setState = (next: CursorState, text = "") => {
      if (next === state && l.textContent === text) return;
      state = next;
      r.dataset.state = next;
      d.dataset.state = next;
      l.textContent = text;
    };

    const onMove = (e: PointerEvent) => {
      dotX(e.clientX);
      dotY(e.clientY);
      ringX(e.clientX);
      ringY(e.clientY);
      d.style.opacity = "1";
      r.style.opacity = "1";

      const target = (e.target as Element | null)?.closest?.(
        "[data-cursor], a, button, input, textarea, select, [role='button']"
      );
      if (!target) return setState("");
      const kind = target.getAttribute("data-cursor");
      if (kind === "view") return setState("view", target.getAttribute("data-cursor-label") || "VIEW");
      if (kind === "image") return setState("image");
      if (kind === "hide") return setState("hide");
      if (kind === "text" || target.matches("input, textarea")) return setState("text");
      setState("link");
    };
    const onDown = () => r.classList.add("is-down");
    const onUp = () => r.classList.remove("is-down");
    const onLeave = () => {
      d.style.opacity = "0";
      r.style.opacity = "0";
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    document.documentElement.addEventListener("pointerleave", onLeave);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.documentElement.classList.remove("has-cursor");
    };
  }, []);

  return (
    <>
      <div ref={ring} className="cursor-ring" aria-hidden>
        <span className="cursor-ring__shape" />
        <span ref={label} className="cursor-ring__label" />
      </div>
      <div ref={dot} className="cursor-dot" aria-hidden />
    </>
  );
}
