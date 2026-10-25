"use client";

import dynamic from "next/dynamic";
import { useIntroFinished } from "../../utils/intro";

const FluidBackground = dynamic(() => import("../FluidBackground"), { ssr: false });

/* The contact page's fluid animation, now fixed behind every page. It follows the
   pointer anywhere on the page and keeps swirling gently on its own when idle. */
export default function FluidLayer() {
  // Waits for the cinematic: it is hidden behind it anyway, and its setup costs frames
  const ready = useIntroFinished();
  if (!ready) return null;

  return (
    <div className="fluid-layer" aria-hidden>
      <FluidBackground global />
    </div>
  );
}
