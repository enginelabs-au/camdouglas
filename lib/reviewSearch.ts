import { reviewProviders } from "@/config/reviews";
import type { ReviewAccount } from "@/lib/reviewIdentity";
import type { ReviewProviderId } from "@/config/types";

const ua = { "User-Agent": "cam-douglas-reviews" };

export function canSearch(id: ReviewProviderId) {
  return reviewProviders.find((item) => item.id === id)?.search === true;
}

export async function searchProvider(id: ReviewProviderId, query: string): Promise<ReviewAccount[]> {
  const q = query.trim().replace(/^@/, "");
  if (q.length < 2) return [];
  if (id === "github") return searchGitHub(q);
  return [];
}

async function searchGitHub(query: string) {
  const headers = {
    ...ua,
    Accept: "application/vnd.github+json",
    ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
  };
  const [exactRes, searchRes] = await Promise.all([
    fetch(`https://api.github.com/users/${encodeURIComponent(query)}`, { headers }),
    fetch(`https://api.github.com/search/users?q=${encodeURIComponent(`${query} in:login`)}&per_page=6`, { headers }),
  ]);
  const accounts: ReviewAccount[] = [];
  if (exactRes.ok) {
    const user = (await exactRes.json()) as { id: number; login: string; name: string | null; avatar_url: string; html_url: string };
    accounts.push({
      id: String(user.id),
      login: user.login,
      name: user.name || user.login,
      avatar: user.avatar_url,
      profileUrl: user.html_url,
    });
  }
  if (searchRes.ok) {
    const payload = (await searchRes.json()) as { items?: Array<{ id: number; login: string; avatar_url: string; html_url: string }> };
    for (const user of payload.items ?? []) {
      if (accounts.some((item) => item.id === String(user.id))) continue;
      accounts.push({
        id: String(user.id),
        login: user.login,
        name: user.login,
        avatar: user.avatar_url,
        profileUrl: user.html_url,
      });
    }
  }
  return accounts.slice(0, 6);
}
