"use client";

import { useExperience } from "@/components/experience/ExperienceContext";
import { AsciiGalaxy } from "@/components/spatial/AsciiGalaxy";

export function GalaxyExperience() {
  const { status } = useExperience();
  if (status === "unsupported") return null;
  return <AsciiGalaxy />;
}
