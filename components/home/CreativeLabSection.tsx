"use client";

import SectionTitle from "./SectionTitle";
import CreativeLab from "../CreativeLab";
import { creativeGroup } from "../../data/site";

export default function CreativeLabSection() {
  return (
    <section id="creative" className="section creative">
      <div className="section-inner">
        <div className="creative-head">
          <SectionTitle first="Creative" second="Lab" eyebrow="/ 06 — Design work" />
          <p className="creative-sub">{creativeGroup.summary}</p>
        </div>
        <CreativeLab />
      </div>
    </section>
  );
}
