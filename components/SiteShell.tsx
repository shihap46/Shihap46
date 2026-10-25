"use client";

import dynamic from "next/dynamic";
import { GameProvider, useGame } from "../context/GameContext";
import GamerHUD from "./GamerHUD";
import CrtOverlay from "./CrtOverlay";
import ProjectModal from "./ProjectModal";
import SiteFooter from "./SiteFooter";
import IntroGate from "./IntroGate";
import SiteNav from "./site/SiteNav";
import CustomCursor from "./site/CustomCursor";
import FluidLayer from "./site/FluidLayer";
import PageTransition from "./site/PageTransition";

// Dynamically import the 3D rover world with SSR disabled for optimal hydration
const CyberRoverGame = dynamic(() => import("./CyberRoverGame"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-0 bg-[#050506] flex flex-col items-center justify-center gap-4">
      <span className="w-3 h-3 rounded-full bg-[var(--acid)] animate-ping" />
      <span className="mono text-xs text-[var(--acid)] tracking-[.3em]">BOOTING CYBER-ROVER…</span>
    </div>
  ),
});

// Lives in the root layout so navigation, cursor, the fluid background and the game are shared by every page
export default function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <GameProvider>
      <ShellContent>{children}</ShellContent>
    </GameProvider>
  );
}

function ShellContent({ children }: { children: React.ReactNode }) {
  const { gameMode } = useGame();

  return (
    <>
      {gameMode === "game" ? (
        // The XP / quest HUD belongs to the game; the portfolio itself stays clean
        <>
          <GamerHUD />
          <CrtOverlay />
          <ProjectModal />
          <CyberRoverGame />
        </>
      ) : (
        <>
          <IntroGate />
          <FluidLayer />
          <CustomCursor />
          <ProjectModal />
          <SiteNav />
          {children}
          <SiteFooter />
          <PageTransition />
        </>
      )}
    </>
  );
}
