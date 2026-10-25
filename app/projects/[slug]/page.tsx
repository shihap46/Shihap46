import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CaseStudyView from "../../../components/CaseStudyView";
import { getProject, projects } from "../../../data/projects";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const project = getProject(slug);
  if (!project) return { title: "Project not found — Shihap" };
  return {
    title: `${project.title} — Shihap`,
    description: project.study.solution,
  };
}

export default async function ProjectPage(props: PageProps<"/projects/[slug]">) {
  const { slug } = await props.params;
  const project = getProject(slug);
  if (!project) notFound();
  return <CaseStudyView project={project} />;
}
