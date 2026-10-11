import { site, socialLinks } from "@/config/site";
import type { Review, ReviewProviderId } from "@/config/types";

export function displayHandle(review: Pick<Review, "handle" | "provider">) {
  if (review.provider === "github") return `@${review.handle.replace(/^@/, "")}`;
  return review.handle;
}

export function fallbackLinkedInProfile(name: string, email?: string) {
  const href = socialLinks.find((item) => item.id === "linkedin")?.href ?? "";
  if (!href) return "";
  if (email && email.toLowerCase() === site.email.toLowerCase()) return href;
  if (name.trim().toLowerCase() === site.name.toLowerCase()) return href;
  return "";
}

export function formatReviewDate(value?: string) {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

export type ReviewProvider = {
  id: ReviewProviderId;
  label: string;
  search: boolean;
  login: boolean;
};

export const reviewProviders: ReviewProvider[] = [
  { id: "linkedin", label: "LinkedIn", search: false, login: true },
  { id: "github", label: "GitHub", search: false, login: true },
];

export const approvedReviews: Review[] = [];
