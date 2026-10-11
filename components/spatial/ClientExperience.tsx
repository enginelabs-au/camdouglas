"use client";

import dynamic from "next/dynamic";

const SpatialShell = dynamic(
  () => import("@/components/spatial/SpatialShell").then((module) => module.SpatialShell),
  { ssr: false },
);

export function ClientExperience() {
  return <SpatialShell />;
}
