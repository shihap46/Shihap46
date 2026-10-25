"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Volume2,
  VolumeX,
  Tv,
  Monitor,
  ListChecks,
  X,
  CheckCircle2,
  CircleDot,
  Gamepad2,
  Globe,
  Zap,
  Trophy,
} from "lucide-react";
import { useGame } from "../context/GameContext";
import { sound } from "../utils/soundFx";

// Mirrors the level curve in GameContext (250 XP per level, 5 levels)
const XP_PER_LEVEL = 250;
const MAX_LEVEL = 5;

export default function GamerHUD() {
  const {
    xp,
    level,
    levelTitle,
    nextLevelXp,
    soundEnabled,
    crtEnabled,
    gameMode,
    quests,
    toasts,
    toggleSound,
    toggleCrt,
    setGameMode,
  } = useGame();

  const [questsOpen, setQuestsOpen] = useState(false);

  const atMax = level >= MAX_LEVEL && xp >= nextLevelXp;
  const withinLevel = Math.max(0, xp - (level - 1) * XP_PER_LEVEL);
  const progress = atMax ? 100 : Math.min(100, (withinLevel / XP_PER_LEVEL) * 100);
  const remaining = quests.filter((q) => !q.completed).length;
  const completedCount = quests.length - remaining;

  // Close the quest drawer with Escape
  useEffect(() => {
    if (!questsOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setQuestsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [questsOpen]);

  const toggleQuests = () => {
    setQuestsOpen((o) => !o);
    sound.playBlip(660);
  };

  return (
    <>
      {/* ───────── TOP HUD BAR ───────── */}
      <div className="gamer-hud fixed top-0 inset-x-0 z-[110] h-12 md:h-14 px-3 md:px-6 flex items-center gap-2 md:gap-4">
        {/* Player status pill */}
        <div className="flex items-center gap-2 shrink-0 hud-chip px-2.5 md:px-3 py-1.5">
          <span className="relative flex w-2 h-2">
            <span className="absolute inline-flex w-full h-full rounded-full bg-[var(--acid)] opacity-60 animate-ping" />
            <span className="relative inline-flex w-2 h-2 rounded-full bg-[var(--acid)]" />
          </span>
          <span className="mono text-[10px] md:text-[11px] font-semibold text-[var(--acid)] tracking-widest">
            LVL {String(level).padStart(2, "0")}
          </span>
          <span className="mono text-[10px] text-neutral-300 tracking-widest hidden lg:inline">
            · {levelTitle}
          </span>
        </div>

        {/* XP progress meter */}
        <div className="flex-1 min-w-0 flex items-center gap-3">
          <div
            className="relative flex-1 h-2 md:h-2.5 rounded-full bg-white/[0.06] border border-white/10 overflow-hidden"
            role="progressbar"
            aria-label="Experience progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
          >
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full xp-fill"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 90, damping: 18 }}
            />
          </div>
          <span className="mono text-[10px] md:text-[11px] text-neutral-300 whitespace-nowrap hidden sm:inline">
            {atMax ? (
              <span className="text-[var(--acid)]">MAX LEVEL · {xp} XP</span>
            ) : (
              <>
                <span className="text-white">{xp}</span> / {nextLevelXp} XP
              </>
            )}
          </span>
        </div>

        {/* Quick controls */}
        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
          <button
            onClick={toggleSound}
            className={`hud-icon-btn ${soundEnabled ? "hud-icon-btn--on" : ""}`}
            aria-label={soundEnabled ? "Mute sound effects" : "Enable sound effects"}
            aria-pressed={soundEnabled}
            title={soundEnabled ? "Sound: ON" : "Sound: OFF"}
          >
            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>

          <button
            onClick={toggleCrt}
            className={`hud-icon-btn ${crtEnabled ? "hud-icon-btn--on" : ""}`}
            aria-label={crtEnabled ? "Disable CRT shader" : "Enable CRT shader"}
            aria-pressed={crtEnabled}
            title={crtEnabled ? "CRT: ON" : "CRT: OFF"}
          >
            {crtEnabled ? <Tv size={15} /> : <Monitor size={15} />}
          </button>

          <button
            onClick={toggleQuests}
            className={`hud-icon-btn relative ${questsOpen ? "hud-icon-btn--on" : ""}`}
            aria-label="Open quest log"
            aria-expanded={questsOpen}
            title="Quest Log"
          >
            <ListChecks size={15} />
            {remaining > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[var(--acid)] text-black mono text-[9px] font-bold flex items-center justify-center">
                {remaining}
              </span>
            )}
          </button>

          <button
            onClick={() => setGameMode(gameMode === "game" ? "web" : "game")}
            className="hud-launch-btn mono"
            aria-label={gameMode === "game" ? "Return to web view" : "Launch 3D rover mode"}
          >
            {gameMode === "game" ? (
              <>
                <Globe size={14} />
                <span className="hidden sm:inline">WEB VIEW</span>
              </>
            ) : (
              <>
                <Gamepad2 size={14} />
                <span className="hidden sm:inline">LAUNCH 3D ROVER</span>
                <span className="sm:hidden">PLAY</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ───────── QUEST DRAWER ───────── */}
      <AnimatePresence>
        {questsOpen && (
          <>
            <motion.div
              key="quest-scrim"
              className="fixed inset-0 z-[111] bg-black/50 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setQuestsOpen(false)}
            />
            <motion.aside
              key="quest-drawer"
              className="fixed top-12 md:top-14 right-0 bottom-0 z-[112] w-full sm:w-[380px] bg-[#070707]/95 border-l border-[var(--acid)]/30 flex flex-col cyber-clip-left"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
              aria-label="Quest log"
            >
              <div className="px-6 pt-6 pb-4 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 mono text-xs text-[var(--acid)] tracking-widest">
                    <Trophy size={14} /> MISSION LOG
                  </div>
                  <button
                    onClick={() => setQuestsOpen(false)}
                    className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-neutral-400 hover:text-white hover:border-white transition"
                    aria-label="Close quest log"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <div className="display text-4xl uppercase">
                    {completedCount}
                    <span className="text-neutral-600">/{quests.length}</span>
                  </div>
                  <div className="mono text-[10px] text-neutral-400 text-right leading-relaxed">
                    OBJECTIVES CLEARED
                    <br />
                    <span className="text-white">{levelTitle}</span>
                  </div>
                </div>
              </div>

              <ul className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5" data-lenis-prevent>
                {quests.map((q, i) => (
                  <li key={q.id} className={`quest-row ${q.completed ? "quest-row--done" : ""}`}>
                    <div className="shrink-0 mt-0.5">
                      {q.completed ? (
                        <CheckCircle2 size={18} className="text-[var(--acid)]" />
                      ) : (
                        <CircleDot size={18} className="text-neutral-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`mono text-[11px] tracking-widest font-semibold ${
                            q.completed ? "text-neutral-500 line-through" : "text-white"
                          }`}
                        >
                          {String(i + 1).padStart(2, "0")} · {q.title}
                        </span>
                        <span
                          className={`mono text-[10px] whitespace-nowrap flex items-center gap-1 ${
                            q.completed ? "text-neutral-600" : "text-[var(--acid)]"
                          }`}
                        >
                          <Zap size={10} />+{q.xp}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 mt-1 leading-relaxed">{q.description}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="px-6 py-4 border-t border-white/10 mono text-[10px] text-neutral-500">
                PROGRESS AUTO-SAVES TO THIS BROWSER
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ───────── XP TOASTS ───────── */}
      <div
        className={`fixed left-1/2 -translate-x-1/2 z-[118] flex flex-col items-center gap-2 pointer-events-none ${
          // In the rover world, sit below the compass / mission panel
          gameMode === "game" ? "top-[236px] md:top-[140px] lg:top-[150px]" : "top-16 md:top-20"
        }`}
      >
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 24, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -28 }}
              transition={{ type: "spring", stiffness: 320, damping: 24 }}
              className="xp-toast mono"
              role="status"
            >
              <span className="text-[var(--acid)] font-bold text-sm">+{t.xp} XP</span>
              <span className="text-[10px] text-neutral-300 tracking-widest">{t.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
