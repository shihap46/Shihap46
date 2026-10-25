"use client";

import { useGame } from "../context/GameContext";

export default function CrtOverlay() {
  const { crtEnabled } = useGame();

  if (!crtEnabled) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[150] overflow-hidden">
      {/* Scanline pattern */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.28) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03))",
          backgroundSize: "100% 3px, 4px 100%",
        }}
      />
      {/* Radial vignette / CRT curve */}
      <div
        className="absolute inset-0"
        style={{
          boxShadow: "inset 0 0 100px rgba(0, 0, 0, 0.85), inset 0 0 40px rgba(167, 139, 250, 0.1)",
        }}
      />
      {/* Phosphor green ambient tint */}
      <div className="absolute inset-0 bg-[#8b7bff]/[0.02] mix-blend-screen" />
      {/* Rolling refresh band */}
      <div className="crt-roll" />
    </div>
  );
}
