import { site } from "@/config/site";

// data-text feeds the cursor-lit copy of the text drawn in CSS (see .cursor-lit in globals.css).
export function Home() {
  return (
    <div className="hero">
      <h1 className="cursor-lit" data-text={site.brandWord}>
        {site.brandWord}
      </h1>
      <div className="hero-copy">
        <p className="hero-lede cursor-lit" data-text={site.tagline}>
          {site.tagline}
        </p>
        <p className="hero-hint">{site.windowLine}</p>
      </div>
    </div>
  );
}
