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
import { usePathname, useRouter } from "next/navigation";
import { cameraDestinations } from "@/config/scene";
import type { DestinationId } from "@/config/types";
import { destinationFromPath, legacyDestinationFromHash, pathForDestination } from "@/lib/routes";
import { prefersReducedMotion, supportsCanvas2D } from "@/lib/capabilities";

export type LoadStatus = "checking" | "loading" | "ready" | "error" | "unsupported";

type ExperienceContextValue = {
  destination: DestinationId;
  reducedMotion: boolean;
  status: LoadStatus;
  errorMessage: string | null;
  canvas2d: boolean;
  resetNonce: number;
  setDestination: (id: DestinationId) => void;
  resetView: () => void;
  setStatus: (status: LoadStatus, message?: string | null) => void;
};

const ExperienceContext = createContext<ExperienceContextValue | null>(null);

export function ExperienceProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const destination = destinationFromPath(pathname);
  const [reducedMotion, setReducedMotion] = useState(false);
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

    // Old hash links (/#reviews) become real URLs (/reviews).
    const redirectLegacyHash = () => {
      const legacy = legacyDestinationFromHash(window.location.hash);
      if (!legacy) return;
      router.replace(`${pathForDestination(legacy)}${window.location.search}`);
    };
    redirectLegacyHash();
    window.addEventListener("hashchange", redirectLegacyHash);

    return () => {
      motion.removeEventListener("change", onMotion);
      window.removeEventListener("hashchange", redirectLegacyHash);
    };
  }, [router]);

  const setDestination = useCallback(
    (id: DestinationId) => {
      if (!cameraDestinations[id]) return;
      const href = pathForDestination(id);
      if (href !== pathname) router.push(href);
    },
    [router, pathname],
  );

  // From another page this glides home; on home it snaps the galaxy back to its starting view.
  const resetView = useCallback(() => {
    if (destination === "home") {
      setResetNonce((value) => value + 1);
      return;
    }
    setDestination("home");
  }, [destination, setDestination]);

  const setStatus = useCallback((next: LoadStatus, message: string | null = null) => {
    setStatusState(next);
    setErrorMessage(message);
  }, []);

  const value = useMemo(
    () => ({
      destination,
      reducedMotion,
      status,
      errorMessage,
      canvas2d,
      resetNonce,
      setDestination,
      resetView,
      setStatus,
    }),
    [
      destination,
      reducedMotion,
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
