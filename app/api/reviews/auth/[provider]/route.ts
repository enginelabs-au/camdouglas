import { randomBytes } from "crypto";
import { NextRequest } from "next/server";
import { reviewProviders } from "@/config/reviews";
import { appOrigin, oauthStateCookie, reviewsReturn } from "@/lib/reviewIdentity";
import type { ReviewAccount } from "@/lib/reviewIdentity";
import type { ReviewProviderId } from "@/config/types";

export const runtime = "nodejs";

const emptyAccount: ReviewAccount = { id: "", login: "", name: "", avatar: "", profileUrl: "" };

export async function GET(request: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = (await params) as { provider: ReviewProviderId };
  const spec = reviewProviders.find((item) => item.id === provider);
  const origin = appOrigin(request);
  if (!spec?.login) {
    return Response.redirect(reviewsReturn(origin, { review_error: "This platform cannot confirm a login." }));
  }

  const account: ReviewAccount = {
    id: request.nextUrl.searchParams.get("id") ?? "",
    login: request.nextUrl.searchParams.get("login") ?? "",
    name: request.nextUrl.searchParams.get("name") ?? "",
    avatar: request.nextUrl.searchParams.get("avatar") ?? "",
    profileUrl: request.nextUrl.searchParams.get("profileUrl") ?? "",
  };
  if (spec.search && (!account.id || !account.login)) {
    return Response.redirect(reviewsReturn(origin, { review_error: "Select an account first." }));
  }

  const nonce = randomBytes(12).toString("hex");
  const redirectUri = `${origin}/api/reviews/auth/${provider}/callback`;
  const headers = new Headers();
  headers.append("Set-Cookie", oauthStateCookie({ provider, account: spec.search ? account : emptyAccount, nonce }));

  try {
    const authorize = authorizeUrl(provider, nonce, redirectUri, account.login);
    headers.set("Location", authorize);
    return new Response(null, { status: 302, headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login is not configured.";
    return Response.redirect(reviewsReturn(origin, { review_error: message }));
  }
}

function authorizeUrl(provider: ReviewProviderId, state: string, redirectUri: string, login: string) {
  if (provider === "github") {
    const id = process.env.GITHUB_CLIENT_ID;
    if (!id) throw new Error("Add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET to confirm GitHub accounts.");
    const url = new URL("https://github.com/login/oauth/authorize");
    url.searchParams.set("client_id", id);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("scope", "read:user user:email");
    url.searchParams.set("state", state);
    if (login) url.searchParams.set("login", login);
    return url.toString();
  }
  if (provider === "google") {
    const id = process.env.GOOGLE_CLIENT_ID;
    if (!id) throw new Error("Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to confirm Google accounts.");
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", id);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("state", state);
    url.searchParams.set("prompt", "select_account");
    return url.toString();
  }
  if (provider === "linkedin") {
    const id = process.env.LINKEDIN_CLIENT_ID;
    if (!id) throw new Error("Add LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET to confirm LinkedIn accounts.");
    const url = new URL("https://www.linkedin.com/oauth/v2/authorization");
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", id);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("scope", "openid profile email");
    return url.toString().replace(/\+/g, "%20");
  }
  throw new Error("This platform cannot confirm a login.");
}
