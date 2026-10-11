import { reviewLoginReady } from "@/lib/reviewIdentity";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({ login: reviewLoginReady() });
}
