"use client";

import { useExperience } from "@/components/experience/ExperienceContext";

export function LoadingState() {
  const { status, progress } = useExperience();
  if (status === "unsupported" || status === "error") return null;

  const percent = Math.round(progress * 100);
  const label = progress > 0 ? `Loading the space ${percent}%` : "Preparing the space";
  const done = status === "ready";

  return (
    <div className={`boot${done ? " is-done" : ""}`} role="status" aria-live="polite" aria-hidden={done}>
      <p>{done ? "Ready" : label}</p>
    </div>
  );
}
