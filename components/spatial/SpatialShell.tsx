"use client";

import { ExperienceProvider } from "@/components/experience/ExperienceContext";
import { Overlay } from "@/components/interface/Overlay";
import { GalaxyExperience } from "@/components/spatial/GalaxyExperience";

export function SpatialShell() {
  return (
    <ExperienceProvider>
      <div className="experience">
        <GalaxyExperience />
        <Overlay />
      </div>
    </ExperienceProvider>
  );
}
