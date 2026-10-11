import { NextRequest } from "next/server";
import { reviewProviders } from "@/config/reviews";
import { canSearch, searchProvider } from "@/lib/reviewSearch";
import type { ReviewProviderId } from "@/config/types";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const provider = request.nextUrl.searchParams.get("provider") as ReviewProviderId | null;
  const query = request.nextUrl.searchParams.get("q") ?? "";
  const spec = reviewProviders.find((item) => item.id === provider);
  if (!spec) return Response.json({ error: "Unknown platform." }, { status: 400 });
  if (!spec.search) {
    return Response.json({ accounts: [], blocker: "This platform cannot be searched." });
  }
  if (!canSearch(spec.id) || query.trim().length < 2) return Response.json({ accounts: [] });
  try {
    const accounts = await searchProvider(spec.id, query);
    return Response.json({ accounts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed.";
    return Response.json({ accounts: [], error: message }, { status: 400 });
  }
}
