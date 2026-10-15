import { SpatialShell } from "@/components/spatial/SpatialShell";
import { listApprovedReviews } from "@/lib/reviewStore";

// Pages are regenerated in the background at most once a minute, and immediately after a review
// is approved, so the published reviews are already in the HTML instead of fetched after load.
export const revalidate = 60;

// The galaxy lives here so it stays mounted while visitors move between pages.
export default async function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const reviews = await listApprovedReviews().catch(() => []);
  return (
    <>
      <SpatialShell reviews={reviews} />
      {children}
    </>
  );
}
