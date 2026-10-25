"use client";

import SplitText from "../site/SplitText";

// Two-word editorial section title whose letters rise in on scroll
export default function SectionTitle({
  first,
  second,
  eyebrow,
  className = "",
  align = "left",
}: {
  first: string;
  second: string;
  eyebrow?: string;
  className?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={`section-title ${align === "center" ? "text-center" : ""} ${className}`}>
      {eyebrow && <p className="mono section-title__eyebrow">{eyebrow}</p>}
      <h2 className="display section-title__text">
        <SplitText text={first} by="chars" />
        <SplitText text={second} by="chars" delay={0.1} />
      </h2>
    </div>
  );
}
