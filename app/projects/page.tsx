import type { Metadata } from "next";
import ProjectsIndex from "../../components/ProjectsIndex";

export const metadata: Metadata = {
  title: "Projects — Shihap",
  description:
    "Case studies: a real-time blood donor network, an AI rooftop solar assessment tool and an AI career guidance platform.",
};

export default function ProjectsPage() {
  return <ProjectsIndex />;
}
