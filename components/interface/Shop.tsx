import { shopItems } from "@/config/production";
import { ExternalLink } from "@/components/interface/ExternalLink";

export function Shop() {
  const offers = shopItems.filter((item) => !item.memberOnly);
  const addons = shopItems.filter((item) => item.memberOnly);

  return (
    <section className="stack" aria-labelledby="shop-heading">
      <h3 id="shop-heading">Shop</h3>
      <ul className="offer-grid">
        {offers.map((item) => (
          <li key={item.id} className="offer-card">
            <h4>{item.name}</h4>
            <p className="offer-price">{item.price}</p>
            <ExternalLink href={item.href} className="offer-cta">
              View on Patreon
            </ExternalLink>
            <p className="offer-summary">{item.summary}</p>
          </li>
        ))}
      </ul>
      <h3>Member add-ons</h3>
      <p className="note">
        Member-only add-ons require an active membership. Checkout stays on Patreon.
      </p>
      <ul className="offer-grid">
        {addons.map((item) => (
          <li key={item.id} className="offer-card">
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
