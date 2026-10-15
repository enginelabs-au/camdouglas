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

  // Cards glow where the pointer is. It only sets two CSS variables on the card under it.
  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const card = (event.target as HTMLElement | null)?.closest<HTMLElement>(".offer-card, .engine-row, .review-card");
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
      card.style.setProperty("--my", `${event.clientY - rect.top}px`);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
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
