import { readIdentity } from "@/lib/reviewIdentity";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const identity = readIdentity(request.headers.get("cookie"));
  if (!identity) return Response.json({ identity: null });
  return Response.json({
    identity: {
      provider: identity.provider,
      id: identity.id,
      login: identity.login,
      name: identity.name,
      avatar: identity.avatar,
      profileUrl: identity.profileUrl,
    },
  });
}
