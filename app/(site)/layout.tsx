import { SpatialShell } from "@/components/spatial/SpatialShell";

// The galaxy lives here so it stays mounted while visitors move between pages.
export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <SpatialShell />
      {children}
    </>
  );
}
