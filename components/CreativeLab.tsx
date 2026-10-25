"use client";

import { creativeLab, type CreativeWork } from "../data/site";
import TiltCard from "./TiltCard";
import Reveal from "./Reveal";

/* Generated artwork so the gallery looks intentional before real files exist.
   Set `image` on an item in data/site.ts to swap in a real design. */
function Artwork({ work }: { work: CreativeWork }) {
  const { color, accent, id } = work;

  if (work.image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={work.image} alt={work.title} className="art-media" />;
  }

  return (
    <svg viewBox="0 0 400 300" className="art-media" role="img" aria-label={`${work.title} sample artwork`}>
      <defs>
        <linearGradient id={`g-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.9" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="#08080a" />

      {id === "logo" && (
        <g>
          <circle cx="200" cy="150" r="74" fill="none" stroke={color} strokeWidth="2" opacity="0.5" />
          <circle cx="200" cy="150" r="46" fill={`url(#g-${id})`} opacity="0.35" />
          <path d="M160 186 L200 104 L240 186 Z" fill="none" stroke={accent} strokeWidth="3" />
          <path d="M176 164 h48" stroke={color} strokeWidth="3" />
          <g stroke={color} strokeWidth="0.5" opacity="0.28">
            <path d="M200 40 v220 M90 150 h220" />
          </g>
        </g>
      )}

      {id === "branding" && (
        <g>
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={40 + i * 82} y={60} width="62" height="62" rx="10" fill={i % 2 ? accent : color} opacity={0.75 - i * 0.14} />
          ))}
          <text x="40" y="196" fill="#f2f2f0" fontFamily="Impact, sans-serif" fontSize="46" letterSpacing="-2">
            Aa Bb Cc
          </text>
          <rect x="40" y="218" width="320" height="2" fill={color} opacity="0.6" />
          <text x="40" y="250" fill="#8a8a8a" fontFamily="monospace" fontSize="13" letterSpacing="3">
            IDENTITY SYSTEM
          </text>
        </g>
      )}

      {id === "poster" && (
        <g>
          <rect x="34" y="26" width="332" height="248" fill="none" stroke={color} strokeWidth="1" opacity="0.45" />
          <circle cx="292" cy="92" r="52" fill={`url(#g-${id})`} opacity="0.6" />
          <text x="56" y="150" fill="#f2f2f0" fontFamily="Impact, sans-serif" fontSize="66" letterSpacing="-3">
            BOLD
          </text>
          <text x="56" y="206" fill={color} fontFamily="Impact, sans-serif" fontSize="66" letterSpacing="-3">
            TYPE
          </text>
          <text x="56" y="244" fill="#8a8a8a" fontFamily="monospace" fontSize="12" letterSpacing="4">
            EVENT · LAUNCH · CAMPAIGN
          </text>
        </g>
      )}

      {id === "brochure" && (
        <g>
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <rect x={38 + i * 110} y="52" width="98" height="196" rx="4" fill="#0e0e11" stroke={color} strokeWidth="1" opacity={0.9 - i * 0.18} />
              <rect x={52 + i * 110} y="72" width="70" height={i === 1 ? 64 : 44} rx="3" fill={i === 1 ? accent : color} opacity="0.5" />
              {[0, 1, 2, 3].map((l) => (
                <rect key={l} x={52 + i * 110} y={(i === 1 ? 150 : 130) + l * 13} width={l === 3 ? 40 : 70} height="5" rx="2" fill="#f2f2f0" opacity="0.22" />
              ))}
            </g>
          ))}
        </g>
      )}

      {id === "print" && (
        <g>
          {["#00c8d7", "#ff4fa3", "#ffd23f", "#f2f2f0"].map((c, i) => (
            <rect key={c} x={54 + i * 76} y="86" width="62" height="128" fill={c} opacity="0.85" />
          ))}
          <g stroke={color} strokeWidth="1.5" opacity="0.7">
            <path d="M30 56 h22 M30 56 v22 M370 56 h-22 M370 56 v22 M30 244 h22 M30 244 v-22 M370 244 h-22 M370 244 v-22" />
          </g>
          <text x="54" y="246" fill="#8a8a8a" fontFamily="monospace" fontSize="12" letterSpacing="4">
            CMYK · BLEED 3MM
          </text>
        </g>
      )}
    </svg>
  );
}

export default function CreativeLab() {
  return (
    <div className="grid gap-4 md:grid-cols-6">
      {creativeLab.map((work, i) => (
        <Reveal
          key={work.id}
          delay={i * 0.06}
          className={i === 0 ? "md:col-span-4" : i === 1 ? "md:col-span-2" : "md:col-span-2"}
        >
          <TiltCard max={10} className="art-card glass rounded-3xl h-full">
            <div className="art-frame">
              <Artwork work={work} />
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between gap-3 mb-2">
                <h3 className="display text-3xl uppercase leading-none">{work.title}</h3>
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: work.color }} />
              </div>
              <p className="text-sm text-neutral-400 leading-relaxed mb-4">{work.line}</p>
              <ul className="flex flex-wrap gap-1.5">
                {work.tags.map((t) => (
                  <li key={t} className="mono text-[10px] px-2 py-0.5 rounded bg-white/[0.04] border border-white/5 text-neutral-400">
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </TiltCard>
        </Reveal>
      ))}
    </div>
  );
}
