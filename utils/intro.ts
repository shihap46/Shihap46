"use client";

import { useEffect, useState } from "react";
import { prefersReducedMotion } from "./scroll";
import { INTRO_KEY as KEY, INTRO_PENDING_CLASS } from "./introBoot";

const STATE_EVENT = "shihap:intro-state";
// If the cinematic never reports back (failed chunk, lost context), stop waiting
const SAFETY_MS = 12_000;

let playing = false;

/** Will the cinematic run for this visit? (home page, first time this session) */
export function introPending(pathname: string) {
  if (typeof window === "undefined") return false;
  if (pathname !== "/" || prefersReducedMotion()) return false;
  try {
    return sessionStorage.getItem(KEY) !== "1";
  } catch {
    return true;
  }
}

export function setIntroPlaying(next: boolean) {
  playing = next;
  window.dispatchEvent(new CustomEvent(STATE_EVENT, { detail: next }));
}

/** Lift the black cover the boot script put over the page while the cinematic was loading. */
export function clearIntroCover() {
  document.documentElement.classList.remove(INTRO_PENDING_CLASS);
}

export function markIntroSeen() {
  try {
    sessionStorage.setItem(KEY, "1");
  } catch {}
}

/* False while the cinematic is on screen. The heavy background scenes sit behind it,
   so they wait for this instead of building their WebGL contexts at the same time —
   four canvases initialising at once is what made the first seconds stutter. */
export function useIntroFinished() {
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!playing && !introPending(window.location.pathname)) {
      setFinished(true);
      return;
    }
    const onState = (e: Event) => {
      if (!(e as CustomEvent<boolean>).detail) setFinished(true);
    };
    window.addEventListener(STATE_EVENT, onState);
    const safety = window.setTimeout(() => setFinished(true), SAFETY_MS);
    return () => {
      window.removeEventListener(STATE_EVENT, onState);
      window.clearTimeout(safety);
    };
  }, []);

  return finished;
}
