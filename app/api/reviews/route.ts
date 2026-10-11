import { site } from "@/config/site";
import { reviewProviders } from "@/config/reviews";
import { readIdentity } from "@/lib/reviewIdentity";

export const runtime = "nodejs";

const inbox = process.env.REVIEW_INBOX ?? site.email;
const recent = new Map<string, number>();

function clampText(value: unknown, min: number, max: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function isRecent(key: string) {
  const last = recent.get(key) ?? 0;
  const now = Date.now();
  if (now - last < 45_000) return true;
  recent.set(key, now);
  return false;
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function sendEmail(subject: string, text: string, html: string) {
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.REVIEW_FROM ?? "Cam Douglas <beth.t@example.com>",
        to: [inbox],
        subject,
        text,
        html,
      }),
    });
    if (!response.ok) {
      throw new Error(`Resend failed (${response.status})`);
    }
    return;
  }

  const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(inbox)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      _subject: subject,
      _captcha: "false",
      _template: "box",
      message: text,
    }),
  });
  const payload = (await response.json().catch(() => null)) as {
    success?: boolean | string;
    message?: string;
    error?: string;
  } | null;
  const message = payload?.message || payload?.error || "";
  if (/activat/i.test(message)) {
    throw new Error(
      `Check ${inbox} (and spam) for a FormSubmit “Activate Form” email, click it, then submit again. For reliable delivery, add a RESEND_API_KEY.`,
    );
  }
  if (!response.ok || payload?.success === false || payload?.success === "false") {
    throw new Error(message || `Mail delivery failed (${response.status})`);
  }
}

export async function POST(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for") ?? "local";
  if (isRecent(forwarded.split(",")[0] ?? "local")) {
    return Response.json({ error: "Please wait a moment before sending another review." }, { status: 429 });
  }

  const identity = readIdentity(request.headers.get("cookie"));
  if (!identity) {
    return Response.json({ error: "Log in to confirm the account before sending a review." }, { status: 401 });
  }

  const spec = reviewProviders.find((item) => item.id === identity.provider);
  if (!spec?.login) {
    return Response.json({ error: "This platform cannot confirm a login." }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const quote = clampText(body?.quote, 20, 1200);
  if (quote.length < 20) return Response.json({ error: "Write a little more in the review." }, { status: 400 });

  const handle = identity.login.replace(/^@/, "");
  const subject = `Review for approval · ${spec.label} · ${identity.name}`;
  const text = [
    "A review was submitted and is waiting for your approval.",
    "",
    `Platform: ${spec.label}`,
    `Name: ${identity.name}`,
    identity.provider === "github" ? `Username: @${handle}` : `Username: ${handle}`,
    identity.email ? `Email: ${identity.email}` : null,
    identity.profileUrl ? `Profile: ${identity.profileUrl}` : null,
    `Verified account id: ${identity.id}`,
    "",
    quote,
    "",
    "Nothing is published until you add it to config/reviews.ts.",
  ]
    .filter((line) => line !== null)
    .join("\n");

  const html = `
    <p>A review was submitted and is waiting for your approval.</p>
    <p><strong>Platform:</strong> ${escapeHtml(spec.label)}<br/>
    <strong>Name:</strong> ${escapeHtml(identity.name)}<br/>
    ${identity.provider === "github" ? `<strong>Username:</strong> @${escapeHtml(handle)}<br/>` : ""}
    ${identity.email ? `<strong>Email:</strong> ${escapeHtml(identity.email)}<br/>` : ""}
    ${identity.profileUrl ? `<strong>Profile:</strong> <a href="${escapeHtml(identity.profileUrl)}">${escapeHtml(identity.profileUrl)}</a><br/>` : ""}
    <strong>Verified account id:</strong> ${escapeHtml(identity.id)}</p>
    <blockquote>${escapeHtml(quote)}</blockquote>
    <p>Nothing is published until you add it to <code>config/reviews.ts</code>.</p>
  `;

  try {
    await sendEmail(subject, text, html);
  } catch {
    return Response.json(
      { error: "The review could not be emailed yet. Try again, or write to Cam directly." },
      { status: 502 },
    );
  }

  return Response.json({ ok: true });
}
