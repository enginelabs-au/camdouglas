"use client";

import { cameraDestinations, primaryNav } from "@/config/scene";
import { site } from "@/config/site";
import { useExperience } from "@/components/experience/ExperienceContext";

export function Navigation() {
  const { destination, setDestination } = useExperience();

  return (
    <header className="site-header">
      <a className="skip-link" href="#content">
        Skip to content
      </a>
      <p className="site-mark">
        <button type="button" onClick={() => setDestination("home")} aria-current={destination === "home" ? "page" : undefined}>
          {site.name}
        </button>
      </p>
      <nav className="glass-nav" aria-label="Primary">
        {primaryNav
          .filter((id) => id !== "home")
          .map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setDestination(destination === id ? "home" : id)}
              aria-current={destination === id ? "page" : undefined}
            >
              {cameraDestinations[id].label}
            </button>
          ))}
      </nav>
    </header>
  );
}
