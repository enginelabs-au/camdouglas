"use client";

import { useEffect, useState, type FormEvent } from "react";
import { approvedReviews, reviewProviders } from "@/config/reviews";
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
  google:
    "M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.163 1.126-2.98 2.267-6.053 2.267-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .255 5.383.255 12s5.612 12 12.225 12c3.59 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z",
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

function loginHref(provider: ReviewProviderId, account?: Account) {
  if (!account) return `/api/reviews/auth/${provider}`;
  const params = new URLSearchParams({
    id: account.id,
    login: account.login,
    name: account.name,
    avatar: account.avatar,
    profileUrl: account.profileUrl,
  });
  return `/api/reviews/auth/${provider}?${params.toString()}`;
}

function confirmedLabel(identity: Identity, label: string) {
  if (identity.provider === "github") return `Confirmed @${identity.login} on ${label}`;
  return `Confirmed ${identity.name} via ${label}`;
}

export function Reviews() {
  const [provider, setProvider] = useState<ReviewProviderId | null>(null);
  const [query, setQuery] = useState("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Account | null>(null);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [ready, setReady] = useState<Partial<Record<ReviewProviderId, boolean>>>({});
  const [quote, setQuote] = useState("");
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
        setIdentity(payload.identity);
        setProvider(payload.identity.provider);
        setSelected(payload.identity);
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
  }, [selected, verified]);

  useEffect(() => {
    if (!spec?.search || verified) return;
    const q = query.trim().replace(/^@/, "");
    if (q.length < 2) {
      setAccounts([]);
      setSearching(false);
      setSearchError(null);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true);
      setSearchError(null);
      try {
        const response = await fetch(
          `/api/reviews/search?provider=${spec.id}&q=${encodeURIComponent(q)}`,
          { signal: controller.signal },
        );
        const payload = (await response.json()) as { accounts?: Account[]; error?: string };
        if (!response.ok) {
          setAccounts([]);
          setSearchError(payload.error ?? "Search failed.");
          return;
        }
        setAccounts(payload.accounts ?? []);
      } catch (caught) {
        if (controller.signal.aborted) return;
        setAccounts([]);
        setSearchError(caught instanceof Error ? caught.message : "Search failed.");
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 320);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query, spec, verified]);

  function pickProvider(id: ReviewProviderId) {
    setProvider(id);
    setQuery("");
    setAccounts([]);
    setSelected(identity?.provider === id ? identity : null);
    setSearchError(null);
    setStatus("idle");
    setError(null);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!verified) {
      setError("Confirm the account first.");
      setStatus("error");
      return;
    }

    setStatus("sending");
    setError(null);
    const response = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quote }),
    });
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) {
      setStatus("error");
      setError(payload?.error ?? "The review could not be sent.");
      return;
    }
    setStatus("sent");
    setQuote("");
  }

  return (
    <article className="panel panel-wide">
      <p className="kicker">Studio</p>
      <h2>Reviews</h2>
      <p className="lede">Notes from people Cam has worked with. Nothing is published until he approves it.</p>

      <section className="stack" aria-labelledby="approved-heading">
        <h3 id="approved-heading">From the studio</h3>
        {approvedReviews.length === 0 ? (
          <p className="empty-state">Approved reviews will appear here with the person’s name.</p>
        ) : (
          <ul className="reviews">
            {approvedReviews.map((review) => (
              <li key={review.id}>
                <blockquote>
                  <p>{review.quote}</p>
                  <footer>
                    <cite>{review.name}</cite>
                    {review.profileUrl ? (
                      <a href={review.profileUrl} target="_blank" rel="noreferrer">
                        {review.provider === "github" ? `@${review.handle}` : review.handle} ·{" "}
                        {reviewProviders.find((item) => item.id === review.provider)?.label}
                      </a>
                    ) : (
                      <span>
                        {review.handle} · {reviewProviders.find((item) => item.id === review.provider)?.label}
                      </span>
                    )}
                  </footer>
                </blockquote>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="stack review-compose" aria-labelledby="leave-review-heading">
        <h3 id="leave-review-heading">Leave A Review For Cam</h3>
        <p className="note">
          Continue with Google or LinkedIn to use the name on that account. For GitHub, search your username, pick the
          matching account, then log in. Cam is emailed afterwards and nothing goes live until he approves it.
        </p>
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

        {spec && !spec.search && !verified ? (
          <div className="selected-account">
            <p className="offer-included">
              {ready[spec.id] === false
                ? `${spec.label} login still needs API keys in .env.local.`
                : `Continue with ${spec.label} to confirm your name.`}
            </p>
            {spec.id === "linkedin" ? (
              <p className="note">
                LinkedIn often stays on its own site after you sign in. Come back to this page and click Log in with
                LinkedIn again. You should skip the password form and see Allow.
              </p>
            ) : null}
            <a className="offer-cta review-submit" href={loginHref(spec.id)}>
              Log in with {spec.label}
            </a>
          </div>
        ) : null}

        {spec?.search && !verified ? (
          <div className="review-form">
            <label htmlFor="review-username">{spec.label} username</label>
            <input
              id="review-username"
              name="username"
              autoComplete="username"
              placeholder="Start typing a username"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setSelected(null);
              }}
            />
            {searching ? <p className="note">Searching {spec.label}…</p> : null}
            {searchError ? <p className="review-error">{searchError}</p> : null}
            {accounts.length > 0 ? (
              <ul className="account-list" role="listbox" aria-label={`${spec.label} accounts`}>
                {accounts.map((account) => (
                  <li key={account.id}>
                    <button
                      type="button"
                      className="account-option"
                      aria-pressed={selected?.id === account.id}
                      onClick={() => setSelected(account)}
                    >
                      {account.avatar ? <img src={account.avatar} alt="" width={36} height={36} /> : <span className="account-fallback" />}
                      <span>
                        <strong>{account.name}</strong>
                        <em>@{account.login}</em>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            {selected ? (
              <div className="selected-account">
                <p className="offer-included">
                  Selected @{selected.login} on {spec.label}
                </p>
                <a className="offer-cta review-submit" href={loginHref(spec.id, selected)}>
                  Log in to confirm this is your account
                </a>
              </div>
            ) : null}
          </div>
        ) : null}

        {verified ? (
          <form className="review-form" onSubmit={onSubmit}>
            <div className="selected-account">
              {verified.avatar ? <img src={verified.avatar} alt="" width={36} height={36} /> : null}
              <p className="offer-included">{confirmedLabel(verified, spec?.label ?? verified.provider)}</p>
            </div>
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
              {status === "sending" ? "Sending for approval" : "Submit for Cam’s approval"}
            </button>
            {status === "sent" ? (
              <p className="note">Sent. Cam will check it before anything appears here.</p>
            ) : null}
          </form>
        ) : null}

        {error ? <p className="review-error">{error}</p> : null}
      </section>
    </article>
  );
}
