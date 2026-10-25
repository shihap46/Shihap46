# Shihap — AI & Data Science Portfolio

A premium creative-developer portfolio: a cinematic 3D intro, scroll-driven animation, per-project case studies and a design gallery.

## Stack
- Next.js (App Router) + React + TypeScript
- Tailwind CSS
- Three.js + React Three Fiber + Drei
- GSAP + ScrollTrigger (scroll animation) + Lenis (smooth scroll)
- Framer Motion (micro-interactions), Lucide icons

## Run
```bash
npm install
npm run dev
```
Open http://localhost:3000

## Pages
- `/` — Home: Hero (3D galaxy) → About → Skills (3D sphere) → Projects → Creative Lab → Contact
- `/work` — Work: AI/ML, Development, 3D, Core, Tools, how the skills connect, academic timeline
- `/projects` — All case studies
- `/projects/[slug]` — One page per project: Problem → Solution → Pipeline → How I built it → Technology → Key features → My contribution → Result

The **HOME** button in the top-right corner opens the menu on every page.

## The intro cinematic
Black screen → stars → galaxy → portal → neural core → 3D name → workspace → portfolio (9s).

- Plays once per browser session on the home page, and is skippable (button, Escape, Enter or Space)
- Replay any time from the **REPLAY INTRO** link in the footer
- Skipped automatically for visitors who prefer reduced motion
- Code: `components/IntroSequence.tsx` (timeline) and `components/three/CosmicScene.tsx` (3D layers)

## Visual system
- **Theme:** electric violet on deep space (`--acid` in `app/globals.css`), with blue, amber and emerald supporting colours
- **Fonts:** Bebas Neue (headings), JetBrains Mono (labels), Space Grotesk (body) — all from Google Fonts
- **Background:** one continuous animated sky behind every page (`components/SpaceBackground.tsx`, pure CSS)
- **Hero name:** real extruded 3D letters that fly in, flip in a wave and tilt with the mouse (`components/Hero3DName.tsx`)
- **Contact:** cursor-driven GPU fluid simulation with relief shading (`components/FluidBackground.tsx`)
- **Case studies:** live 3D scenes for the blood donor network and rooftop solar projects (`components/scenes/`)
- **Game:** sculpted sports car, boost pads, floating crystals, meteors, exhaust flames and speed streaks

The 3D hero font is three.js's Helvetiker Bold (`public/fonts/`, license alongside it).

## Personalize
- `data/site.ts` — email, links, academic years, HOME menu, skill groups, Creative Lab items
- `data/projects.ts` — projects and their full case studies (`study.problem`, `study.build`, `study.result`, …)

### Adding real images
- **Project screenshot or clip:** put the file in `public/` and set `study.media` on that project, e.g. `media: { image: "/solar-result.png", caption: "Result screen" }` (a `video` works the same way). Without it, the page shows the 3D model.
- **Design work:** put the file in `public/` and set `image` on a Creative Lab item in `data/site.ts`. Without it, generated SVG artwork is shown.
- **Live demo button:** set `demo: "https://…"` on a project; the button only appears when it exists.

## Build note
On machines where Windows Application Control blocks Next's native SWC binary, Turbopack cannot run; use `npx next build --webpack` and `npx next dev --webpack`.
