import type { Metadata } from "next";
import WorkView from "../../components/WorkView";

export const metadata: Metadata = {
  title: "Work — Shihap",
  description:
    "Machine learning (XGBoost, LightGBM), deep learning (PyTorch, TensorFlow, Keras), AI web apps (FastAPI, Flask, Streamlit) and graphic design (logo, branding, print, brochure, poster).",
};

export default function WorkPage() {
  return <WorkView />;
}
