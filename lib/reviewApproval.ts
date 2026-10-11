import { randomBytes } from "crypto";
import type { Review } from "@/config/types";
import type { ReviewIdentity } from "@/lib/reviewIdentity";
import { readPayload, signPayload } from "@/lib/reviewIdentity";

const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;

type ApprovalToken = Review & { exp: number };

export function parseRating(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  const stepped = Math.round(n * 2) / 2;
  if (stepped < 0.5 || stepped > 5) return null;
  return stepped;
}

export function reviewFromIdentity(identity: ReviewIdentity, quote: string, rating: number): Review {
  return {
    id: `rev_${randomBytes(8).toString("hex")}`,
    name: identity.name,
    handle: identity.login.replace(/^@/, ""),
    quote,
    provider: identity.provider,
    profileUrl: identity.profileUrl,
    avatar: identity.avatar,
    rating,
    date: new Date().toISOString().slice(0, 10),
  };
}

export function approvalToken(review: Review) {
  const payload: ApprovalToken = { ...review, exp: Date.now() + MAX_AGE_MS };
  return signPayload(payload);
}

export function readApprovalToken(token: string | undefined | null): Review | null {
  const payload = readPayload<ApprovalToken>(token);
  if (!payload?.id || !payload.quote || !payload.handle || !payload.provider) return null;
  if (parseRating(payload.rating) === null) return null;
  if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
  const { exp: _exp, ...review } = payload;
  return review;
}

export function approvalUrl(origin: string, token: string) {
  const url = new URL("/api/reviews/approve", origin);
  url.searchParams.set("token", token);
  return url.toString();
}
