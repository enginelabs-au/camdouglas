import { readIdentity } from "@/lib/reviewIdentity";
import { hydrateIdentity } from "@/lib/reviewStore";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const identity = readIdentity(request.headers.get("cookie"));
  if (!identity) return Response.json({ identity: null });
  const hydrated = await hydrateIdentity(identity);
  return Response.json({
    identity: {
      provider: hydrated.provider,
      id: hydrated.id,
      login: hydrated.login,
      name: hydrated.name,
      avatar: hydrated.avatar,
      profileUrl: hydrated.profileUrl,
    },
  });
}
