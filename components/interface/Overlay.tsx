"use client";

import { useEffect } from "react";
import { useExperience } from "@/components/experience/ExperienceContext";
import { About } from "@/components/interface/About";
import { Contact } from "@/components/interface/Contact";
import { EngineLabs } from "@/components/interface/EngineLabs";
import { Home } from "@/components/interface/Home";
import { Navigation } from "@/components/interface/Navigation";
import { Production } from "@/components/interface/Production";
import { Footer } from "@/components/interface/Footer";
import { Reviews } from "@/components/interface/Reviews";
import { SceneFallback } from "@/components/interface/SceneFallback";

export function Overlay() {
  const { destination, status, errorMessage, setDestination, resetView } = useExperience();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }

      if (event.key === "Escape") {
        resetView();
        return;
      }

      if (event.key === "h" || event.key === "H") {
        setDestination("home");
      } else if (event.key === "r" || event.key === "R") {
        resetView();
      } else if (event.key === "1") {
        setDestination("home");
      } else if (event.key === "2") {
        setDestination("production");
      } else if (event.key === "3") {
        setDestination("engine-labs");
      } else if (event.key === "4") {
        setDestination("about");
      } else if (event.key === "5") {
        setDestination("reviews");
      } else if (event.key === "6") {
        setDestination("contact");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [resetView, setDestination]);

  // Pointer-lit surfaces. The handler only writes CSS variables; the drawing is all in CSS.
  // Cards and links light where the pointer is over them. The hero text and the name have
  // pointer-events off (the galaxy can be dragged through them), so they are hit-tested by
  // geometry. The panel title's rule carries the pointer's horizontal position.
  useEffect(() => {
    const SURFACES = ".offer-card, .engine-row, .review-card, .glass-nav a, .site-footer a";
    const REACH = 28;
    const lit = () => document.querySelectorAll<HTMLElement>(".cursor-lit");
    const onMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const x = event.clientX;
      const y = event.clientY;
      const surface = event.target instanceof Element ? event.target.closest<HTMLElement>(SURFACES) : null;
      if (surface) {
        const rect = surface.getBoundingClientRect();
        surface.style.setProperty("--mx", `${x - rect.left}px`);
        surface.style.setProperty("--my", `${y - rect.top}px`);
      }
      const panel = document.querySelector<HTMLElement>(".panel");
      if (panel) {
        const rect = panel.getBoundingClientRect();
        const along = rect.width > 0 ? Math.min(100, Math.max(0, ((x - rect.left) / rect.width) * 100)) : 50;
        panel.style.setProperty("--lx", `${along.toFixed(1)}%`);
      }
      for (const text of lit()) {
        const rect = text.getBoundingClientRect();
        const near = x > rect.left - REACH && x < rect.right + REACH && y > rect.top - REACH && y < rect.bottom + REACH;
        text.style.setProperty("--glow", near ? "1" : "0");
        if (near) {
          text.style.setProperty("--mx", `${x - rect.left}px`);
          text.style.setProperty("--my", `${y - rect.top}px`);
        }
      }
    };
    const onLeave = () => {
      for (const text of lit()) text.style.setProperty("--glow", "0");
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div className="overlay">
      <div className="fade-top" />
      <div className="fade-bottom" />
      <Navigation />
      <main
        id="content"
        className={
          destination === "home"
            ? "content-home"
            : destination === "production" ||
                destination === "engine-labs" ||
                destination === "reviews" ||
                destination === "about"
              ? "content content-wide"
              : "content"
        }
        tabIndex={-1}
      >
        {destination === "home" ? <Home /> : null}
        {destination === "production" ? <Production /> : null}
        {destination === "engine-labs" ? <EngineLabs /> : null}
        {destination === "about" ? <About /> : null}
        {destination === "reviews" ? <Reviews /> : null}
        {destination === "contact" ? <Contact /> : null}
      </main>
      <Footer />
      {status === "unsupported" ? <SceneFallback reason="unsupported" /> : null}
      {status === "error" ? <SceneFallback reason="error" message={errorMessage} /> : null}
    </div>
  );
}
