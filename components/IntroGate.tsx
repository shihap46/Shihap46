"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { clearIntroCover, introPending, markIntroSeen, setIntroPlaying } from "../utils/intro";

const IntroSequence = dynamic(() => import("./IntroSequence"), { ssr: false });

export const REPLAY_EVENT = "shihap:replay-intro";
const COVER_SAFETY_MS = 10_000;

/** Plays the cinematic on the first home-page visit of a session, and on demand after that. */
export default function IntroGate() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const replay = () => {
      setIntroPlaying(true);
      setShow(true);
    };
    window.addEventListener(REPLAY_EVENT, replay);
    return () => window.removeEventListener(REPLAY_EVENT, replay);
  }, []);

  useEffect(() => {
    if (!introPending(pathname)) {
      clearIntroCover();
      setIntroPlaying(false);
      return;
    }
    setIntroPlaying(true);
    setShow(true);
    // If the cinematic's chunk never arrives, don't leave the page behind the cover
    const safety = window.setTimeout(clearIntroCover, COVER_SAFETY_MS);
    return () => window.clearTimeout(safety);
  }, [pathname]);

  const done = useCallback(() => {
    markIntroSeen();
    clearIntroCover();
    setIntroPlaying(false);
    setShow(false);
  }, []);

  if (!show) return null;
  return <IntroSequence onDone={done} />;
}
