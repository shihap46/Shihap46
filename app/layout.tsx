import type {Metadata} from "next";
import { Archivo, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import SmoothScroll from "../components/SmoothScroll";
import SiteShell from "../components/SiteShell";
import SpaceBackground from "../components/SpaceBackground";
import { INTRO_BOOT_SCRIPT } from "../utils/introBoot";

export const metadata: Metadata = {
  title: "Shihap — AI & Data Science Developer",
  description:
    "Portfolio of Shihap, a B.Tech AI & Data Science student (2025–2029) working across machine learning, deep learning, AI-powered web apps and graphic design.",
};

// Archivo carries a width axis: condensed for display type, expanded for wide headings
const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the boot script adds a class to <html> before React hydrates
    <html lang="en" className={`${archivo.variable} ${inter.variable} ${mono.variable}`} suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: INTRO_BOOT_SCRIPT }} />
        <SpaceBackground />
        <SmoothScroll />
        <div className="noise" />
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
