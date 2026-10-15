"use client";

import { engines } from "@/config/engines";
import { engineLabs, site } from "@/config/site";
import { useExperience } from "@/components/experience/ExperienceContext";
import { Kicker } from "@/components/interface/Kicker";
import { ExternalLink } from "@/components/interface/ExternalLink";
import { StudentFeedback } from "@/components/interface/StudentFeedback";

export function EngineLabs() {
  const { setDestination } = useExperience();
  const { firstStep } = engineLabs;

  return (
    <article className="panel panel-wide">
      <Kicker text={site.softwareLabels.join(" · ")} />
      <h1>{engineLabs.headline}</h1>
      <p className="lede">{engineLabs.lede}</p>
      <p>{engineLabs.summary}</p>
      <p className="audience">{engineLabs.audience}</p>
      <p className="first-step">
        {firstStep.before} <ExternalLink href={firstStep.href}>{firstStep.label}</ExternalLink>, {firstStep.after}
      </p>
      <section className="stack" aria-labelledby="engines-heading">
        <h3 id="engines-heading">Eight Engines. One catalog.</h3>
        <ul className="engine-list">
          {engines.map((engine) => (
            <li key={engine.id}>
              <a className="engine-row" href={engine.href} target="_blank" rel="noreferrer">
                <div className="engine-head">
                  <h4>{engine.name}</h4>
                  <span className="engine-kicker">{engine.category}</span>
                </div>
                <p>{engine.tagline}</p>
                <p className="engine-meta">
                  Replaces · {engine.replaces}
                  <span>{engine.price}</span>
                </p>
              </a>
            </li>
          ))}
        </ul>
      </section>
      <p>
        <a href={engineLabs.catalogHref} target="_blank" rel="noreferrer">
          See the full catalog
        </a>
      </p>
      <StudentFeedback />
      <p>
        <button type="button" className="text-button" onClick={() => setDestination("reviews")}>
          Leave a review
        </button>
      </p>
    </article>
  );
}
