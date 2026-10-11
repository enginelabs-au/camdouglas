import { contactCopy, site } from "@/config/site";

export function Contact() {
  return (
    <article className="panel">
      <p className="kicker">Studio and agency</p>
      <h2>{contactCopy.headline}</h2>
      <p className="lede">{contactCopy.lede}</p>
      <p>
        <a href={`mailto:${site.email}`}>{site.email}</a>
      </p>
    </article>
  );
}
