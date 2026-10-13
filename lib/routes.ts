import type { DestinationId } from "@/config/types";

export const routeByDestination: Record<DestinationId, string> = {
  home: "/",
  production: "/music",
  "engine-labs": "/software",
  about: "/about",
  reviews: "/reviews",
  contact: "/contact",
};

export function pathForDestination(id: DestinationId): string {
  return routeByDestination[id];
}

export function destinationFromPath(pathname: string | null): DestinationId {
  const clean = (pathname ?? "/").replace(/\/+$/, "") || "/";
  const match = (Object.keys(routeByDestination) as DestinationId[]).find(
    (id) => routeByDestination[id] === clean,
  );
  return match ?? "home";
}

// Old links used hashes (/#reviews, /#engine-labs). They are redirected to real URLs.
export function legacyDestinationFromHash(hash: string): DestinationId | null {
  const value = hash.replace(/^#/, "");
  if (!value) return null;
  if (value === "feedback") return "reviews";
  if (value === "home") return "home";
  return (Object.keys(routeByDestination) as DestinationId[]).includes(value as DestinationId)
    ? (value as DestinationId)
    : null;
}
