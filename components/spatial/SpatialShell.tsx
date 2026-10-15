"use client";

import { ExperienceProvider } from "@/components/experience/ExperienceContext";
import { Overlay } from "@/components/interface/Overlay";
import { InitialReviewsContext } from "@/components/interface/PublishedReviews";
import { GalaxyExperience } from "@/components/spatial/GalaxyExperience";
import type { Review } from "@/config/types";

export function SpatialShell({ reviews }: { reviews: Review[] }) {
  return (
    <ExperienceProvider>
      <InitialReviewsContext.Provider value={reviews}>
        <div className="experience">
          <GalaxyExperience />
          <Overlay />
        </div>
      </InitialReviewsContext.Provider>
    </ExperienceProvider>
  );
}
