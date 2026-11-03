"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useIntroFinished } from "../../utils/intro";

const FluidBackground = dynamic(() => import("../FluidBackground"), { ssr: false });

/* The contact page's fluid animation, now fixed behind every page. It follows the
   pointer anywhere on the page and keeps swirling gently on its own when idle. */
export default function FluidLayer() {
  // Waits for the cinematic: it is hidden behind it anyway, and its setup costs frames
  const ready = useIntroFinished();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!ready) return;
    // Defer the fluid canvas slightly so the hero 3D scene claims GPU resources first
    const idle = window.requestIdleCallback?.(() => setMounted(true), { timeout: 600 }) ??
      window.setTimeout(() => setMounted(true), 400);
    return () => {
      window.cancelIdleCallback?.(idle);
      window.clearTimeout(idle);
    };
  }, [ready]);

  if (!ready || !mounted) return null;

  return (
    <div className="fluid-layer" aria-hidden>
      <FluidBackground global />
    </div>
  );
}
