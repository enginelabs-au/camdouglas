import { memberships, shopItems } from "@/config/production";
import { ExternalLink } from "@/components/interface/ExternalLink";

export function FeaturedOffers() {
  const plans = memberships.filter((item) => item.featured);
  const products = shopItems.filter((item) => item.featured && !item.memberOnly);

  return (
    <section className="stack" aria-labelledby="featured-heading">
      <h3 id="featured-heading">Featured</h3>
      <ul className="offer-grid">
        {plans.map((item) => (
          <li key={item.id} className="offer-card is-featured">
            <p className="offer-badge">Featured membership</p>
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
        {products.map((item) => (
          <li key={item.id} className="offer-card is-featured">
            <p className="offer-badge">Featured course</p>
            <h4>{item.name}</h4>
            <p className="offer-price">{item.price}</p>
            <ExternalLink href={item.href} className="offer-cta">
              View on Patreon
            </ExternalLink>
            <p className="offer-summary">{item.summary}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
