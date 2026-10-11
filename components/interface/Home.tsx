import { site } from "@/config/site";

export function Home() {
  return (
    <div className="hero">
      <h1>{site.brandWord}</h1>
      <div className="hero-copy">
        <p className="hero-lede">{site.description}</p>
        <p className="hero-hint">{site.windowLine}</p>
      </div>
    </div>
  );
}
