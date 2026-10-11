import { NextRequest } from "next/server";
import {
  identityCookie,
  clearOAuthStateCookie,
  readOAuthState,
  reviewsReturn,
  appOrigin,
} from "@/lib/reviewIdentity";
import { persistRemoteAvatar, saveReviewerSession } from "@/lib/reviewStore";
import { fallbackLinkedInProfile } from "@/config/reviews";
import type { ReviewAccount, ReviewIdentity } from "@/lib/reviewIdentity";
import type { ReviewProviderId } from "@/config/types";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = (await params) as { provider: ReviewProviderId };
  const origin = appOrigin(request);
  const error = request.nextUrl.searchParams.get("error");
  if (error) {
    const detail = request.nextUrl.searchParams.get("error_description") || (error === "access_denied" ? "Login was cancelled." : error);
    return Response.redirect(reviewsReturn(origin, { review_error: detail }));
  }

  const state = readOAuthState(request.headers.get("cookie"));
  const nonce = request.nextUrl.searchParams.get("state");
  const code = request.nextUrl.searchParams.get("code");
  if (!state || !nonce || state.nonce !== nonce || state.provider !== provider) {
    return Response.redirect(reviewsReturn(origin, { review_error: "Login expired. Choose a platform and try again." }));
  }
  if (!code) {
    return Response.redirect(reviewsReturn(origin, { review_error: "Login did not return a code." }));
  }

  try {
    const loggedIn = await fetchLoggedIn(provider, code, `${origin}/api/reviews/auth/${provider}/callback`);
    const expected = state.account;
    if (expected?.id && loggedIn.id !== expected.id && loggedIn.login.toLowerCase() !== expected.login.toLowerCase()) {
      return Response.redirect(
        reviewsReturn(origin, { review_error: `You logged in as ${loggedIn.login}, not ${expected.login}.` }),
      );
    }
    const identity: ReviewIdentity = {
      provider: state.provider,
      id: loggedIn.id,
      login: loggedIn.login,
      name: loggedIn.name || expected?.name || loggedIn.login,
      avatar: loggedIn.avatar || expected?.avatar || "",
      profileUrl: loggedIn.profileUrl || expected?.profileUrl || "",
      email: loggedIn.email,
    };
    if (identity.provider === "linkedin" && !identity.profileUrl) {
      identity.profileUrl = fallbackLinkedInProfile(identity.name, identity.email);
    }
    if (identity.provider === "linkedin" && identity.avatar) {
      identity.avatar = await persistRemoteAvatar(identity.provider, identity.id, identity.avatar);
    }
    try {
      await saveReviewerSession(identity);
    } catch (error) {
      console.error("Reviewer session save failed", error);
    }
    const headers = new Headers();
    headers.append("Set-Cookie", identityCookie(identity));
    headers.append("Set-Cookie", clearOAuthStateCookie());
    headers.set("Location", reviewsReturn(origin, { review_ok: "1" }));
    return new Response(null, { status: 302, headers });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Login failed.";
    return Response.redirect(reviewsReturn(origin, { review_error: message }));
  }
}

type LoggedIn = ReviewAccount & { email?: string };

async function fetchLoggedIn(provider: ReviewProviderId, code: string, redirectUri: string): Promise<LoggedIn> {
  if (provider === "github") return githubUser(code, redirectUri);
  if (provider === "linkedin") return linkedinUser(code, redirectUri);
  throw new Error("This platform cannot confirm a login.");
}

async function githubUser(code: string, redirectUri: string): Promise<LoggedIn> {
  const id = process.env.GITHUB_CLIENT_ID;
  const secret = process.env.GITHUB_CLIENT_SECRET;
  if (!id || !secret) throw new Error("GitHub login is not configured.");
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: id, client_secret: secret, code, redirect_uri: redirectUri }),
  });
  const token = (await tokenRes.json()) as { access_token?: string; error?: string };
  if (!token.access_token) throw new Error(token.error || "GitHub did not return a token.");
  const headers = {
    Authorization: `Bearer ${token.access_token}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "cam-douglas-reviews",
  };
  const [userRes, emailRes] = await Promise.all([
    fetch("https://api.github.com/user", { headers }),
    fetch("https://api.github.com/user/emails", { headers }),
  ]);
  if (!userRes.ok) throw new Error("GitHub could not load your account.");
  const user = (await userRes.json()) as { id: number; login: string; name: string | null; avatar_url: string; html_url: string; email: string | null };
  let email = user.email ?? undefined;
  if (emailRes.ok) {
    const emails = (await emailRes.json()) as Array<{ email: string; primary: boolean; verified: boolean }>;
    email = emails.find((item) => item.primary && item.verified)?.email ?? emails.find((item) => item.verified)?.email ?? email;
  }
  return {
    id: String(user.id),
    login: user.login,
    name: user.name || user.login,
    avatar: user.avatar_url,
    profileUrl: user.html_url,
    email,
  };
}

async function linkedinUser(code: string, redirectUri: string): Promise<LoggedIn> {
  const id = process.env.LINKEDIN_CLIENT_ID?.trim();
  const secret = process.env.LINKEDIN_CLIENT_SECRET?.trim();
  if (!id || !secret) throw new Error("LinkedIn login is not configured.");
  const tokenBody = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: id,
    client_secret: secret,
  });
  const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: tokenBody,
  });
  const token = (await tokenRes.json()) as {
    access_token?: string;
    id_token?: string;
    error?: string;
    error_description?: string;
  };
  if (!token.access_token) {
    throw new Error(token.error_description || token.error || "LinkedIn did not return a token.");
  }
  const claims = claimsFromIdToken(token.id_token);
  const userRes = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  if (!userRes.ok) throw new Error("LinkedIn could not load your account.");
  const user = (await userRes.json()) as {
    sub: string;
    name?: string;
    given_name?: string;
    family_name?: string;
    email?: string;
    picture?: string;
    profile?: string;
  };
  const name =
    user.name ||
    (typeof claims.name === "string" ? claims.name : "") ||
    [user.given_name, user.family_name].filter(Boolean).join(" ") ||
    user.email ||
    user.sub;
  const picture = user.picture || (typeof claims.picture === "string" ? claims.picture : "") || "";
  let profileUrl =
    user.profile ||
    (typeof claims.profile === "string" ? claims.profile : "") ||
    "";
  try {
    const meRes = await fetch("https://api.linkedin.com/v2/me?projection=(vanityName)", {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    if (meRes.ok) {
      const me = (await meRes.json()) as { vanityName?: string };
      if (me.vanityName) profileUrl = `https://www.linkedin.com/in/${encodeURIComponent(me.vanityName)}`;
    }
  } catch {
    // OpenID still gives name and photo even if vanityName is unavailable.
  }
  return {
    id: user.sub,
    login: name,
    name,
    avatar: picture,
    profileUrl,
    email: user.email || (typeof claims.email === "string" ? claims.email : undefined),
  };
}

function claimsFromIdToken(idToken?: string): Record<string, unknown> {
  if (!idToken) return {};
  const payload = idToken.split(".")[1];
  if (!payload) return {};
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Record<string, unknown>;
  } catch {
    return {};
  }
}
