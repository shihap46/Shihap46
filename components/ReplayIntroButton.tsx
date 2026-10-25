"use client";

import { useRouter, usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { REPLAY_EVENT } from "./IntroGate";

// Replays the cinematic; the gate only mounts it on the home page, so route there first
export default function ReplayIntroButton() {
  const router = useRouter();
  const pathname = usePathname();

  const replay = () => {
    if (pathname !== "/") {
      router.push("/");
      window.setTimeout(() => window.dispatchEvent(new Event(REPLAY_EVENT)), 500);
      return;
    }
    window.dispatchEvent(new Event(REPLAY_EVENT));
  };

  return (
    <button type="button" onClick={replay} className="hover:text-white transition flex items-center gap-1.5">
      <Sparkles size={12} /> REPLAY INTRO
    </button>
  );
}
