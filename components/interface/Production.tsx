"use client";

import { productionCopy, site } from "@/config/site";
import { useExperience } from "@/components/experience/ExperienceContext";
import { ExternalLink } from "@/components/interface/ExternalLink";
import { FeaturedOffers } from "@/components/interface/FeaturedOffers";
import { Memberships } from "@/components/interface/Memberships";
import { Shop } from "@/components/interface/Shop";
import { StudentFeedback } from "@/components/interface/StudentFeedback";

export function Production() {
  const { setDestination } = useExperience();
  const { firstStep } = productionCopy;

  return (
    <article className="panel panel-wide">
      <p className="kicker">{site.musicLabels.join(" · ")}</p>
      <h1>{productionCopy.headline}</h1>
      <p className="lede">{productionCopy.lede}</p>
      <p className="audience">{productionCopy.audience}</p>
      <p className="first-step">
        {firstStep.before}{" "}
        <ExternalLink href={firstStep.href}>{firstStep.label}</ExternalLink>, {firstStep.after}
      </p>
      <FeaturedOffers />
      <Memberships />
      <Shop />
      <StudentFeedback />
      <p>
        <button type="button" className="text-button" onClick={() => setDestination("reviews")}>
          Leave a review
        </button>
      </p>
    </article>
  );
}
