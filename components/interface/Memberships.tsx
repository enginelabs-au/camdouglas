import { memberships } from "@/config/production";
import { ExternalLink } from "@/components/interface/ExternalLink";

export function Memberships() {
  const plans = memberships.filter((item) => !item.featured);

  return (
    <section className="stack" aria-labelledby="memberships-heading">
      <h3 id="memberships-heading">More memberships</h3>
      <ul className="offer-grid">
        {plans.map((item) => (
          <li key={item.id} className="offer-card">
            <h4>{item.name}</h4>
            <p className="offer-price">
              {item.price}
              {item.period ? <span>{item.period}</span> : null}
            </p>
            <ExternalLink href={item.href} className="offer-cta">
              {item.cta}
            </ExternalLink>
            <p className="offer-summary">{item.summary}</p>
            <p className="offer-included">Included</p>
            <ul>
              {item.includes.map((entry) => (
                <li key={entry}>{entry}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}
