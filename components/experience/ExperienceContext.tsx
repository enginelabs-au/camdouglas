"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { cameraDestinations } from "@/config/scene";
import type { DestinationId } from "@/config/types";
import { destinationFromHash, hashFromDestination } from "@/lib/hash";
import { prefersReducedMotion, supportsCanvas2D } from "@/lib/capabilities";

export type LoadStatus = "checking" | "loading" | "ready" | "error" | "unsupported";

type ExperienceContextValue = {
  destination: DestinationId;
  exploring: boolean;
  reducedMotion: boolean;
  progress: number;
  status: LoadStatus;
  errorMessage: string | null;
  canvas2d: boolean;
  resetNonce: number;
  setDestination: (id: DestinationId) => void;
  setExploring: (value: boolean) => void;
  resetView: () => void;
  setProgress: (value: number) => void;
  setStatus: (status: LoadStatus, message?: string | null) => void;
};

const ExperienceContext = createContext<ExperienceContextValue | null>(null);

export function ExperienceProvider({ children }: { children: ReactNode }) {
  const [destination, setDestinationState] = useState<DestinationId>("home");
  const [exploring, setExploring] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatusState] = useState<LoadStatus>("checking");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [canvas2d, setCanvas2d] = useState(true);
  const [resetNonce, setResetNonce] = useState(0);

  useEffect(() => {
    const supported = supportsCanvas2D();
    setCanvas2d(supported);
    setReducedMotion(prefersReducedMotion());
    setStatusState((current) => {
      if (!supported) return "unsupported";
      if (current === "ready") return current;
      return "loading";
    });

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotion = () => setReducedMotion(motion.matches);
    motion.addEventListener("change", onMotion);

    const applyHash = () => {
      const next = destinationFromHash(window.location.hash);
      setDestinationState(next);
      setExploring(false);
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);

    return () => {
      motion.removeEventListener("change", onMotion);
      window.removeEventListener("hashchange", applyHash);
    };
  }, []);

  const setDestination = useCallback((id: DestinationId) => {
    if (!cameraDestinations[id]) return;
    setDestinationState(id);
    setExploring(false);
    const nextHash = hashFromDestination(id);
    if (window.location.hash.replace(/^#/, "") === nextHash.replace(/^#/, "")) return;
    window.history.replaceState(null, "", nextHash || window.location.pathname);
  }, []);

  const resetView = useCallback(() => {
    setExploring(false);
    setDestination("home");
    setResetNonce((value) => value + 1);
  }, [setDestination]);

  const setStatus = useCallback((next: LoadStatus, message: string | null = null) => {
    setStatusState(next);
    setErrorMessage(message);
  }, []);

  const value = useMemo(
    () => ({
      destination,
      exploring,
      reducedMotion,
      progress,
      status,
      errorMessage,
      canvas2d,
      resetNonce,
      setDestination,
      setExploring,
      resetView,
      setProgress,
      setStatus,
    }),
    [
      destination,
      exploring,
      reducedMotion,
      progress,
      status,
      errorMessage,
      canvas2d,
      resetNonce,
      setDestination,
      resetView,
      setStatus,
    ],
  );

  return <ExperienceContext.Provider value={value}>{children}</ExperienceContext.Provider>;
}

export function useExperience() {
  const value = useContext(ExperienceContext);
  if (!value) {
    throw new Error("useExperience must be used within ExperienceProvider");
  }
  return value;
}
