"use client";

import { productionCopy } from "@/config/site";
import { useExperience } from "@/components/experience/ExperienceContext";
import { Memberships } from "@/components/interface/Memberships";
import { Shop } from "@/components/interface/Shop";
import { StudentFeedback } from "@/components/interface/StudentFeedback";

export function Production() {
  const { setDestination } = useExperience();

  return (
    <article className="panel panel-wide">
      <p className="kicker">Studio</p>
      <h2>{productionCopy.headline}</h2>
      <p className="lede">{productionCopy.lede}</p>
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
