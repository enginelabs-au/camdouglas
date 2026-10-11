import type { Review, ReviewProviderId } from "@/config/types";

export type ReviewProvider = {
  id: ReviewProviderId;
  label: string;
  search: boolean;
  login: boolean;
};

export const reviewProviders: ReviewProvider[] = [
  { id: "google", label: "Google", search: false, login: true },
  { id: "linkedin", label: "LinkedIn", search: false, login: true },
  { id: "github", label: "GitHub", search: true, login: true },
];

export const approvedReviews: Review[] = [];
