import { engines } from "@/config/engines";
import { engineLabs } from "@/config/site";

export function EngineLabs() {
  return (
    <article className="panel panel-wide">
      <p className="kicker">Agency</p>
      <h2>{engineLabs.headline}</h2>
      <p className="lede">{engineLabs.lede}</p>
      <p>{engineLabs.summary}</p>
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
    </article>
  );
}
