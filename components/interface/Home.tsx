import { site } from "@/config/site";

export function Home() {
  return (
    <div className="hero">
      <h1>{site.brandWord}</h1>
      <div className="hero-copy">
        <p>
          {site.description} {site.windowLine}
        </p>
      </div>
    </div>
  );
}
