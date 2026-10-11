import { appOrigin, reviewsReturn } from "@/lib/reviewIdentity";
import { displayHandle } from "@/config/reviews";
import { readApprovalToken } from "@/lib/reviewApproval";
import { publishReview } from "@/lib/reviewStore";

export const runtime = "nodejs";

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function page(title: string, body: string, href: string, refresh: boolean) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    ${refresh ? `<meta http-equiv="refresh" content="2;url=${escapeHtml(href)}" />` : ""}
    <title>${escapeHtml(title)}</title>
    <style>
      body { margin: 0; min-height: 100dvh; display: grid; place-items: center; background: #05070c; color: #f7f4ef; font: 16px/1.45 -apple-system, BlinkMacSystemFont, sans-serif; }
      main { max-width: 28rem; padding: 1.5rem; }
      a { color: #f7f4ef; }
    </style>
  </head>
  <body>
    <main>
      <p>${body}</p>
      <p><a href="${escapeHtml(href)}">Open Reviews</a></p>
    </main>
  </body>
</html>`;
}

export async function GET(request: Request) {
  const origin = appOrigin(request);
  const href = reviewsReturn(origin);
  const token = new URL(request.url).searchParams.get("token");
  const review = readApprovalToken(token);
  if (!review) {
    return new Response(page("Approve link expired", "This approve link is invalid or expired.", href, false), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  try {
    const result = await publishReview(review);
    const who = `${escapeHtml(review.name)} (${escapeHtml(displayHandle(review))})`;
    const message = result.created
      ? `Published. The review from ${who} is now on the Reviews tab.`
      : `Already published. The review from ${who} is on the Reviews tab.`;
    return new Response(page("Review published", message, href, true), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    console.error("Review approve failed", error);
    return new Response(
      page("Could not publish", "The review could not be published yet. Try the link again in a moment.", href, false),
      { status: 502, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }
}
