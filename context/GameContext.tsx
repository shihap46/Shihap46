"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { sound } from "../utils/soundFx";

export interface Quest {
  id: string;
  title: string;
  description: string;
  xp: number;
  completed: boolean;
}

export interface ToastNotification {
  id: string;
  text: string;
  xp: number;
}

export interface ProjectModalData {
  slug?: string;
  title: string;
  category: string;
  tag: string;
  desc: string;
  tech: string[];
  metrics: string;
  href: string;
  color: string;
}

interface GameContextType {
  xp: number;
  level: number;
  levelTitle: string;
  nextLevelXp: number;
  soundEnabled: boolean;
  crtEnabled: boolean;
  gameMode: "web" | "game";
  quests: Quest[];
  toasts: ToastNotification[];
  activeProjectModal: ProjectModalData | null;
  toggleSound: () => void;
  toggleCrt: () => void;
  setGameMode: (mode: "web" | "game") => void;
  addXp: (amount: number, reason: string) => void;
  completeQuest: (questId: string) => void;
  openProjectModal: (proj: ProjectModalData) => void;
  closeProjectModal: () => void;
}

const INITIAL_QUESTS: Quest[] = [
  {
    id: "explore_site",
    title: "INITIATE RECON",
    description: "Begin exploring Shihap's neural portfolio",
    xp: 50,
    completed: false,
  },
  {
    id: "inspect_project",
    title: "PROJECT INFILTRATION",
    description: "Access and inspect at least one AI project terminal",
    xp: 100,
    completed: false,
  },
  {
    id: "orbit_skills",
    title: "ORBIT THE MATRIX",
    description: "Explore the animated skills wall on the home page",
    xp: 75,
    completed: false,
  },
  {
    id: "launch_rover",
    title: "ROVER PILOT",
    description: "Launch the 3D Cyber-Rover and drive across the terrain",
    xp: 150,
    completed: false,
  },
  {
    id: "dock_station",
    title: "STATION DOCKING",
    description: "Drive the rover into an interactive project hangar",
    xp: 200,
    completed: false,
  },
  {
    id: "collect_skills",
    title: "DATA HARVESTER",
    description: "Collect 3 glowing skill orbs in the 3D exploration world",
    xp: 250,
    completed: false,
  },
  {
    id: "copy_email",
    title: "DIRECT TRANSMISSION",
    description: "Copy direct contact frequency or send email dispatch",
    xp: 50,
    completed: false,
  },
];

const LEVEL_TITLES = [
  "RECON SCOUT",
  "CYBER NAVIGATOR",
  "DATA ARCHITECT",
  "NEURAL ENGINEER",
  "AI SYSTEM MASTER",
];

const GameContext = createContext<GameContextType | undefined>(undefined);

const XP_PER_LEVEL = 250;
const levelForXp = (value: number) =>
  Math.min(Math.floor(value / XP_PER_LEVEL) + 1, LEVEL_TITLES.length);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [xp, setXp] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [crtEnabled, setCrtEnabled] = useState(false);
  const [gameMode, setGameMode] = useState<"web" | "game">("web");
  const [quests, setQuests] = useState<Quest[]>(INITIAL_QUESTS);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [activeProjectModal, setActiveProjectModal] = useState<ProjectModalData | null>(null);

  // Synchronous mirrors of xp/quests. Side effects (sounds, toasts, chained XP)
  // must not run inside state updaters — StrictMode double-invokes those in dev.
  const xpRef = useRef(0);
  const questsRef = useRef<Quest[]>(INITIAL_QUESTS);

  // Load persisted state from localStorage on client
  useEffect(() => {
    try {
      const savedXp = localStorage.getItem("shihap_game_xp");
      if (savedXp) {
        xpRef.current = parseInt(savedXp, 10) || 0;
        setXp(xpRef.current);
      }

      const savedSound = localStorage.getItem("shihap_game_audio");
      if (savedSound === "true") {
        setSoundEnabled(true);
        sound.setEnabled(true);
      }

      const savedCrt = localStorage.getItem("shihap_game_crt");
      if (savedCrt === "true") setCrtEnabled(true);

      const savedQuests = localStorage.getItem("shihap_game_quests");
      if (savedQuests) {
        const saved: Quest[] = JSON.parse(savedQuests);
        // Merge onto the current quest list so renamed/added quests still appear
        const merged = INITIAL_QUESTS.map((q) => ({
          ...q,
          completed: saved.some((s) => s.id === q.id && s.completed),
        }));
        questsRef.current = merged;
        setQuests(merged);
      }
    } catch {}
  }, []);

  // Level calculation: Each level requires 250 XP
  const level = levelForXp(xp);
  const levelTitle = LEVEL_TITLES[level - 1] || "AI ARCHITECT";
  const nextLevelXp = level * XP_PER_LEVEL;

  const addXp = useCallback((amount: number, reason: string) => {
    const prev = xpRef.current;
    const next = prev + amount;
    xpRef.current = next;
    setXp(next);
    try {
      localStorage.setItem("shihap_game_xp", next.toString());
    } catch {}

    if (levelForXp(next) > levelForXp(prev)) {
      sound.playLevelUp();
    } else {
      sound.playXp();
    }

    // Add popup toast
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((t) => [...t, { id, text: reason, xp: amount }]);
    setTimeout(() => {
      setToasts((t) => t.filter((toast) => toast.id !== id));
    }, 3000);
  }, []);

  const completeQuest = useCallback(
    (questId: string) => {
      const quest = questsRef.current.find((q) => q.id === questId);
      if (!quest || quest.completed) return;

      const updated = questsRef.current.map((q) =>
        q.id === questId ? { ...q, completed: true } : q
      );
      questsRef.current = updated;
      setQuests(updated);
      try {
        localStorage.setItem("shihap_game_quests", JSON.stringify(updated));
      } catch {}

      addXp(quest.xp, `QUEST COMPLETE: ${quest.title}`);
    },
    [addXp]
  );

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.setEnabled(next);
    if (next) sound.playBlip(980);
  };

  const toggleCrt = () => {
    const next = !crtEnabled;
    setCrtEnabled(next);
    try {
      localStorage.setItem("shihap_game_crt", next ? "true" : "false");
    } catch {}
    sound.playBlip(720);
  };

  const openProjectModal = (proj: ProjectModalData) => {
    setActiveProjectModal(proj);
    completeQuest("inspect_project");
    sound.playDock();
  };

  const closeProjectModal = () => {
    setActiveProjectModal(null);
    sound.playBlip(600);
  };

  return (
    <GameContext.Provider
      value={{
        xp,
        level,
        levelTitle,
        nextLevelXp,
        soundEnabled,
        crtEnabled,
        gameMode,
        quests,
        toasts,
        activeProjectModal,
        toggleSound,
        toggleCrt,
        setGameMode: (m) => {
          setGameMode(m);
          sound.playBlip(800);
          if (m === "game") completeQuest("launch_rover");
        },
        addXp,
        completeQuest,
        openProjectModal,
        closeProjectModal,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}
