"use client";

import { useEffect, useState, type FormEvent } from "react";
import { reviewProviders } from "@/config/reviews";
import { PublishedReviews } from "@/components/interface/PublishedReviews";
import { StarRating } from "@/components/interface/StarRating";
import type { ReviewProviderId } from "@/config/types";

type Account = {
  id: string;
  login: string;
  name: string;
  avatar: string;
  profileUrl: string;
};

type Identity = Account & { provider: ReviewProviderId };

const icons: Record<ReviewProviderId, string> = {
  linkedin:
    "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  github:
    "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12",
};

function ProviderMark({ id }: { id: ReviewProviderId }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={icons[id]} />
    </svg>
  );
}

function loginHref(provider: ReviewProviderId) {
  return `/api/reviews/auth/${provider}`;
}

function confirmedLabel(identity: Identity) {
  const label = reviewProviders.find((item) => item.id === identity.provider)?.label ?? identity.provider;
  if (identity.provider === "github") return `Confirmed @${identity.login} on ${label}`;
  return `Confirmed ${identity.name} via ${label}`;
}

export function Reviews() {
  const [provider, setProvider] = useState<ReviewProviderId | null>(null);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [ready, setReady] = useState<Partial<Record<ReviewProviderId, boolean>>>({});
  const [quote, setQuote] = useState("");
  const [rating, setRating] = useState(0);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const spec = reviewProviders.find((item) => item.id === provider);
  const verified = identity && provider && identity.provider === provider ? identity : null;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ok = params.get("review_ok") === "1";
    const reviewError = params.get("review_error");
    if (reviewError) setError(reviewError);
    if (ok || reviewError) {
      const url = new URL(window.location.href);
      url.searchParams.delete("review_ok");
      url.searchParams.delete("review_error");
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash || "#reviews"}`);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/reviews/me")
      .then((response) => response.json())
      .then((payload: { identity?: Identity | null }) => {
        if (cancelled || !payload.identity) return;
        if (!reviewProviders.some((item) => item.id === payload.identity?.provider)) return;
        setIdentity(payload.identity);
        setProvider(payload.identity.provider);
      })
      .catch(() => undefined);
    fetch("/api/reviews/status")
      .then((response) => response.json())
      .then((payload: { login?: Partial<Record<ReviewProviderId, boolean>> }) => {
        if (!cancelled) setReady(payload.login ?? {});
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    document.querySelector(".selected-account")?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [verified]);

  function pickProvider(id: ReviewProviderId) {
    setProvider(id);
    setStatus("idle");
    setError(null);
  }

  async function startLogin(id: ReviewProviderId) {
    setError(null);
    try {
      const href = loginHref(id);
      const response = await fetch(href, {
        headers: { Accept: "application/json" },
        cache: "no-store",
        redirect: "manual",
      });
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("Location");
        window.location.assign(location || href);
        return;
      }
      const payload = (await response.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (payload?.url) {
        window.location.assign(payload.url);
        return;
      }
      setError(payload?.error ?? "Login could not start.");
    } catch {
      window.location.assign(loginHref(id));
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!verified) {
      setError("Confirm the account first.");
      setStatus("error");
      return;
    }
    if (rating < 0.5) {
      setError("Choose a star rating.");
      setStatus("error");
      return;
    }

    setStatus("sending");
    setError(null);
    const response = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quote, rating }),
    });
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) {
      setStatus("error");
      setError(payload?.error ?? "The review could not be sent.");
      return;
    }
    setStatus("sent");
    setQuote("");
    setRating(0);
  }

  return (
    <article className="panel panel-wide">
      <h2>Leave A Review For Cam</h2>

      <section className="stack review-compose" aria-label="Leave a review">
        {spec && !verified ? (
          <div className="selected-account">
            <p className="offer-included">
              {ready[spec.id] === false
                ? `${spec.label} login still needs API keys in .env.local.`
                : `Continue with ${spec.label} to confirm your name.`}
            </p>
            <button type="button" className="offer-cta review-submit" onClick={() => startLogin(spec.id)}>
              Log in with {spec.label}
            </button>
          </div>
        ) : null}

        {verified ? (
          <form className="review-form" onSubmit={onSubmit}>
            <div className="selected-account">
              {verified.avatar ? (
                <img src={verified.avatar} alt="" width={36} height={36} referrerPolicy="no-referrer" />
              ) : null}
              <p className="offer-included">{confirmedLabel(verified)}</p>
              {verified.profileUrl ? (
                <a className="review-profile" href={verified.profileUrl} target="_blank" rel="noreferrer">
                  View profile
                </a>
              ) : null}
            </div>
            <p className="review-form-label" id="review-rating-label">
              Rating
            </p>
            <StarRating value={rating} onChange={setRating} />
            <label htmlFor="review-quote">Review</label>
            <textarea
              id="review-quote"
              name="quote"
              value={quote}
              onChange={(event) => setQuote(event.target.value)}
              required
              minLength={20}
            />
            <button type="submit" className="offer-cta review-submit" disabled={status === "sending"}>
              {status === "sending" ? "Sending" : "Submit"}
            </button>
            {status === "sent" ? (
              <p className="note" role="status">
                Sent. Cam will check it before anything appears here.
              </p>
            ) : null}
          </form>
        ) : null}

        {error ? (
          <p className="review-error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="provider-grid" role="group" aria-label="Review platforms">
          {reviewProviders.map((item) => (
            <button
              key={item.id}
              type="button"
              className="provider-btn"
              aria-pressed={provider === item.id}
              onClick={() => pickProvider(item.id)}
            >
              <ProviderMark id={item.id} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </section>

      <PublishedReviews />
    </article>
  );
}
