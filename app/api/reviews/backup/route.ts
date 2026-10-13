import { snapshotPublishedReviews } from "@/lib/reviewStore";

export const runtime = "nodejs";

function authorized(request: Request) {
  if (request.headers.get("x-vercel-cron") === "1") return true;
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  return Boolean(secret && auth === `Bearer ${secret}`);
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await snapshotPublishedReviews();
  return Response.json(
    { ok: true, count: result.reviews.length, stored: result.stored },
    { headers: { "Cache-Control": "no-store" } },
  );
}
