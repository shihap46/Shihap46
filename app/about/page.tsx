import type { Metadata } from "next";
import AboutView from "../../components/about/AboutView";

export const metadata: Metadata = {
  title: "About — Shihap",
  description:
    "About Shihap — B.Tech AI & Data Science student at MSEC (2025–2029) building intelligent software, interactive web experiences and visual design.",
};

export default function AboutPage() {
  return <AboutView />;
}
