"use client";

import { useId, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight } from "lucide-react";
import Magnetic from "../site/Magnetic";
import { useGame } from "../../context/GameContext";
import { profile, projectTypes } from "../../data/site";
import { prefersReducedMotion } from "../../utils/scroll";

gsap.registerPlugin(useGSAP);

type Field = "name" | "email" | "company" | "need" | "message";
const REQUIRED: Field[] = ["name", "email", "need", "message"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const STEPS: { field: Field; label: string; placeholder: string; required: boolean; type?: string; autoComplete?: string }[] = [
  { field: "name", label: "My name", placeholder: "Your full name", required: true, autoComplete: "name" },
  { field: "email", label: "My email", placeholder: "you@example.com", required: true, type: "email", autoComplete: "email" },
  { field: "company", label: "I work / study at (optional)", placeholder: "Company, college or just me", required: false, autoComplete: "organization" },
  { field: "need", label: "I'm looking for", placeholder: "An AI model, a web app, a logo …", required: true },
  { field: "message", label: "My message", placeholder: "Hey Shihap, can you help me with …", required: true },
];

/* Numbered, one-line-per-step contact form. Each underline draws in on focus; the
   project-type chips fill step 04. Sending opens the visitor's email app, pre-filled. */
export default function ContactForm() {
  const { completeQuest } = useGame();
  const form = useRef<HTMLFormElement>(null);
  const uid = useId();
  const [values, setValues] = useState<Record<Field, string>>({ name: "", email: "", company: "", need: "", message: "" });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [sent, setSent] = useState(false);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.from(".cp-step", { y: 40, opacity: 0, duration: 1, stagger: 0.08, ease: "expo.out", delay: 0.35 });
      gsap.from(".cp-send", { y: 30, opacity: 0, duration: 1, ease: "expo.out", delay: 0.8 });
    },
    { scope: form }
  );

  const set = (field: Field, value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field]) setErrors((er) => ({ ...er, [field]: undefined }));
  };

  const toggleNeed = (type: string) => {
    const parts = values.need.split(",").map((p) => p.trim()).filter(Boolean);
    const next = parts.includes(type) ? parts.filter((p) => p !== type) : [...parts, type];
    set("need", next.join(", "));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Partial<Record<Field, string>> = {};
    for (const f of REQUIRED) if (!values[f].trim()) next[f] = "This one is required.";
    if (values.email.trim() && !EMAIL_RE.test(values.email.trim())) next.email = "That email doesn't look right.";
    setErrors(next);

    const firstBad = STEPS.find((s) => next[s.field])?.field;
    if (firstBad) {
      const step = form.current?.querySelector(`[data-field="${firstBad}"]`);
      if (step && !prefersReducedMotion()) gsap.fromTo(step, { x: -12 }, { x: 0, duration: 0.6, ease: "elastic.out(1, 0.3)" });
      document.getElementById(`${uid}-${firstBad}`)?.focus();
      return;
    }

    const v = Object.fromEntries(Object.entries(values).map(([k, val]) => [k, val.trim()])) as Record<Field, string>;
    const subject = `Project enquiry — ${v.need} — ${v.name}`;
    const body = [
      "Hi Shihap,",
      "",
      v.message,
      "",
      "—",
      `Name: ${v.name}`,
      `Email: ${v.email}`,
      ...(v.company ? [`Works / studies at: ${v.company}`] : []),
      `Looking for: ${v.need}`,
    ].join("\n");
    completeQuest("copy_email");
    setSent(true);
    window.location.href = `mailto:${profile.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const chosen = values.need.split(",").map((p) => p.trim());

  return (
    <form ref={form} className="cp-form" onSubmit={submit} noValidate>
      {STEPS.map((step, i) => {
        const id = `${uid}-${step.field}`;
        const common = {
          id,
          name: step.field,
          value: values[step.field],
          placeholder: step.placeholder,
          autoComplete: step.autoComplete,
          "aria-required": step.required,
          "aria-invalid": !!errors[step.field],
          "aria-describedby": errors[step.field] ? `${id}-err` : undefined,
          className: "cp-input",
        };
        return (
          <div key={step.field} data-field={step.field} className={`cp-step ${errors[step.field] ? "is-bad" : ""}`}>
            <span className="cp-n display">0{i + 1}.</span>
            <div className="cp-fld">
              <label htmlFor={id} className="cp-label">
                {step.label}
              </label>
              {step.field === "message" ? (
                <textarea
                  {...common}
                  rows={3}
                  onChange={(e) => {
                    set("message", e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                />
              ) : (
                <input {...common} type={step.type ?? "text"} onChange={(e) => set(step.field, e.target.value)} />
              )}
              {step.field === "need" && (
                <div className="cp-chips" role="group" aria-label="Quick picks">
                  {projectTypes.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`cp-chip ${chosen.includes(t) ? "is-on" : ""}`}
                      aria-pressed={chosen.includes(t)}
                      onClick={() => toggleNeed(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
              {errors[step.field] && (
                <p id={`${id}-err`} className="cp-err mono" role="alert">
                  {errors[step.field]}
                </p>
              )}
            </div>
          </div>
        );
      })}

      <div className="cp-send">
        <Magnetic strength={0.3}>
          <button type="submit" className="cp-send__btn" data-cursor="link">
            <span className="cp-send__roll">
              <span>{sent ? "Opened your email app ✓" : "Send it over :)"}</span>
              <span aria-hidden>{sent ? "Send again" : "Send it over :)"}</span>
            </span>
            <ArrowUpRight size={20} />
          </button>
        </Magnetic>
        <p className="cp-note mono" aria-live="polite">
          {sent ? "If nothing opened, email me directly at " : "Sending opens your email app with everything filled in — or write to "}
          <a href={`mailto:${profile.email}`}>{profile.email}</a>
        </p>
      </div>
    </form>
  );
}
