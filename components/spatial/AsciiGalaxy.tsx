"use client";

import { useEffect, useRef } from "react";
import { galaxyViews } from "@/config/scene";
import { useExperience } from "@/components/experience/ExperienceContext";
import { startAsciiGalaxy, type GalaxyHandle } from "@/lib/asciiGalaxy";

export function AsciiGalaxy() {
  const rootRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<GalaxyHandle | null>(null);
  const { destination, reducedMotion, status, setStatus, resetNonce } = useExperience();
  const handledNonce = useRef(0);
  const destinationRef = useRef(destination);

  useEffect(() => {
    destinationRef.current = destination;
  }, [destination]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const startDestination = destinationRef.current;
    const handle = startAsciiGalaxy(root, {
      reducedMotion,
      initialView: galaxyViews[startDestination],
    });
    handleRef.current = handle;
    if (!handle) {
      setStatus("unsupported");
      return undefined;
    }

    handle.setView(galaxyViews[startDestination], startDestination === "home");
    setStatus("ready");

    return () => {
      handle.destroy();
      handleRef.current = null;
    };
  }, [reducedMotion, setStatus]);

  useEffect(() => {
    const handle = handleRef.current;
    if (!handle) return;
    const view = galaxyViews[destination];
    if (resetNonce !== handledNonce.current) {
      handledNonce.current = resetNonce;
      handle.reset(view);
      return;
    }
    handle.setView(view, destination === "home");
  }, [destination, resetNonce]);

  // The renderer adds its own canvas to this element.
  return (
    <div
      ref={rootRef}
      id="ascii-galaxy-only"
      className={`ascii-galaxy${status === "ready" ? " is-ready" : ""}`}
    />
  );
}
