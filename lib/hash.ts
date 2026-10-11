import type { DestinationId } from "@/config/types";

const destinations: DestinationId[] = [
  "home",
  "production",
  "engine-labs",
  "about",
  "contact",
  "reviews",
];

export function destinationFromHash(hash: string): DestinationId {
  const value = hash.replace(/^#/, "");
  if (value === "feedback") return "reviews";
  return destinations.includes(value as DestinationId) ? (value as DestinationId) : "home";
}

export function hashFromDestination(id: DestinationId): string {
  return id === "home" ? "" : `#${id}`;
}
