import { about } from "@/config/site";

export function About() {
  return (
    <article className="panel">
      <p className="kicker">Biography</p>
      <h2>{about.headline}</h2>
      <p className="lede">{about.lede}</p>
      {about.paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </article>
  );
}
