import { createHmac, timingSafeEqual } from "crypto";
import type { ReviewProviderId } from "@/config/types";

export type ReviewAccount = {
  id: string;
  login: string;
  name: string;
  avatar: string;
  profileUrl: string;
};

export type ReviewIdentity = ReviewAccount & {
  provider: ReviewProviderId;
  email?: string;
};

const IDENTITY = "review_identity";
const OAUTH_STATE = "review_oauth_state";

function secret() {
  return process.env.AUTH_SECRET || process.env.GITHUB_CLIENT_SECRET || "dev-review-secret";
}

function sign(value: string) {
  const hmac = createHmac("sha256", secret()).update(value).digest("base64url");
  return `${value}.${hmac}`;
}

function unsign(token: string) {
  const cut = token.lastIndexOf(".");
  if (cut < 1) return null;
  const value = token.slice(0, cut);
  const digest = token.slice(cut + 1);
  const expected = createHmac("sha256", secret()).update(value).digest("base64url");
  const a = Buffer.from(digest);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return value;
}

function encode(payload: unknown) {
  return sign(Buffer.from(JSON.stringify(payload), "utf8").toString("base64url"));
}

function decode<T>(token: string | undefined | null): T | null {
  if (!token) return null;
  const value = unsign(token);
  if (!value) return null;
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

function cookie(name: string, token: string, maxAge: number) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${name}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export function identityCookie(identity: ReviewIdentity) {
  return cookie(IDENTITY, encode(identity), 60 * 60);
}

export function oauthStateCookie(state: {
  provider: ReviewProviderId;
  account: ReviewAccount | null;
  nonce: string;
}) {
  return cookie(OAUTH_STATE, encode({ ...state, ts: Date.now() }), 600);
}

export function clearIdentityCookie() {
  return `${IDENTITY}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function readIdentity(header: string | null): ReviewIdentity | null {
  return decode<ReviewIdentity>(readNamed(header, IDENTITY));
}

export function readOAuthState(header: string | null) {
  return decode<{ provider: ReviewProviderId; account: ReviewAccount | null; nonce: string; ts: number }>(
    readNamed(header, OAUTH_STATE),
  );
}

export function reviewLoginReady() {
  return {
    github: Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
    google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    linkedin: Boolean(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET),
  };
}

function readNamed(header: string | null, name: string) {
  if (!header) return null;
  const match = header.split(/;\s*/).find((part) => part.startsWith(`${name}=`));
  return match ? match.slice(name.length + 1) : null;
}

export function appOrigin(request: Request) {
  if (process.env.REVIEW_APP_URL) return process.env.REVIEW_APP_URL.replace(/\/$/, "");
  const url = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") ?? url.host;
  const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  return `${proto}://${host}`;
}

export function reviewsReturn(origin: string, params?: Record<string, string>) {
  const url = new URL("/", origin);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }
  url.hash = "reviews";
  return url.toString();
}
