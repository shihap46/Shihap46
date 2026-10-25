import type { Metadata } from "next";
import ContactView from "../../components/contact/ContactView";

export const metadata: Metadata = {
  title: "Contact — Shihap",
  description: "Get in touch with Shihap — AI & Data Science developer. Tell me about your idea, or download my résumé.",
};

export default function ContactPage() {
  return <ContactView />;
}
