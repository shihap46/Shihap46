import type { Metadata } from "next";
import ResumeView from "../../components/resume/ResumeView";

export const metadata: Metadata = {
  title: "Résumé — Shihapdeen S.",
  description:
    "Official resume and curriculum vitae of Shihapdeen S. — B.Tech AI & Data Science student (2025–2029) at Mohamed Sathak Engineering College seeking a software development internship.",
};

export default function ResumePage() {
  return <ResumeView />;
}
