"use client";

import Link from "next/link";
import { cameraDestinations, primaryNav } from "@/config/scene";
import { site } from "@/config/site";
import { useExperience } from "@/components/experience/ExperienceContext";
import { SydneyClock } from "@/components/interface/SydneyClock";
import { pathForDestination } from "@/lib/routes";

export function Navigation() {
  const { destination } = useExperience();

  return (
    <header className="site-header">
      <a className="skip-link" href="#content">
        Skip to content
      </a>
      <p className="site-mark">
        <Link
          href="/"
          className="cursor-lit"
          data-text={site.name}
          aria-current={destination === "home" ? "page" : undefined}
        >
          {site.name}
        </Link>
        <SydneyClock />
      </p>
      <nav className="glass-nav" aria-label="Primary">
        {primaryNav
          .filter((id) => id !== "home")
          .map((id) => (
            <Link
              key={id}
              href={pathForDestination(destination === id ? "home" : id)}
              aria-current={destination === id ? "page" : undefined}
            >
              {cameraDestinations[id].label}
            </Link>
          ))}
      </nav>
    </header>
  );
}
