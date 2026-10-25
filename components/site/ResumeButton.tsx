"use client";

import { useEffect, useState } from "react";
import Magnetic from "./Magnetic";
import { profile } from "../../data/site";

type Status = "checking" | "ready" | "missing";

/* Résumé download: the label rolls up on hover, a violet fill rises behind it and the
   arrow drops. It checks the PDF exists first, so until public/resume.pdf is added
   the button reads "coming soon" instead of leading to a 404. */
export default function ResumeButton({ label = "Download Résumé" }: { label?: string }) {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    let alive = true;
    fetch(profile.resume, { method: "HEAD", cache: "no-store" })
      .then((res) => {
        const type = res.headers.get("content-type") ?? "";
        if (alive) setStatus(res.ok && !type.includes("text/html") ? "ready" : "missing");
      })
      .catch(() => alive && setStatus("missing"));
    return () => {
      alive = false;
    };
  }, []);

  if (status !== "ready") {
    return (
      <span className="resume-btn is-disabled" aria-disabled="true">
        <span className="resume-btn__txt">
          <span>{status === "checking" ? label : "Résumé coming soon"}</span>
        </span>
      </span>
    );
  }

  return (
    <Magnetic strength={0.3}>
      <a
        className="resume-btn"
        href={profile.resume}
        download={`${(profile.fullName || profile.name).replace(/\s+/g, "_")}_Resume.pdf`}
        data-cursor="link"
      >
        <span className="resume-btn__txt">
          <span>{label}</span>
          <span aria-hidden>{label}</span>
        </span>
        <span className="resume-btn__ico" aria-hidden />
      </a>
    </Magnetic>
  );
}
