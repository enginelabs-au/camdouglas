import { mkdir, readdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { head, list, put } from "@vercel/blob";
import { approvedReviews as seeded, fallbackLinkedInProfile } from "@/config/reviews";
import type { Review } from "@/config/types";
import type { ReviewIdentity } from "@/lib/reviewIdentity";

const BLOB_PREFIX = "reviews/published/";
const INBOX_PREFIX = "reviews/inbox/";
const ARCHIVE_PREFIX = "reviews/archive/";
const SNAPSHOT_PREFIX = "reviews/snapshots/";
const SESSION_PREFIX = "reviews/sessions/";
const LOCAL_DIR = path.join(process.cwd(), ".data", "reviews");
const LOCAL_SESSION_DIR = path.join(process.cwd(), ".data", "review-sessions");

function blobReady() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function isReview(value: unknown): value is Review {
  if (!value || typeof value !== "object") return false;
  const item = value as Review;
  const rating = Number(item.rating);
  return Boolean(
    item.id &&
      item.name &&
      item.handle &&
      item.quote &&
      item.provider &&
      Number.isFinite(rating) &&
      rating >= 0.5 &&
      rating <= 5,
  );
}

function blobPath(id: string) {
  return `${BLOB_PREFIX}${id}.json`;
}

function localPath(id: string) {
  return path.join(LOCAL_DIR, `${id}.json`);
}

async function readJson(url: string): Promise<unknown> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return null;
  return response.json();
}

async function readBlob(): Promise<Review[]> {
  const { blobs } = await list({ prefix: BLOB_PREFIX });
  const reviews = await Promise.all(
    blobs.map(async (item) => {
      try {
        return await readJson(item.downloadUrl || item.url);
      } catch {
        return null;
      }
    }),
  );
  return reviews.filter(isReview);
}

async function putReviewJson(pathname: string, review: Review | Review[], overwrite: boolean) {
  await put(pathname, JSON.stringify(review), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: overwrite,
    contentType: "application/json",
    cacheControlMaxAge: 0,
  });
}

async function writeBlob(review: Review) {
  await putReviewJson(blobPath(review.id), review, false);
}

async function blobHas(id: string) {
  const { blobs } = await list({ prefix: blobPath(id) });
  return blobs.some((item) => item.pathname === blobPath(id));
}

async function readLocal(): Promise<Review[]> {
  try {
    const files = await readdir(LOCAL_DIR);
    const reviews = await Promise.all(
      files.filter((file) => file.endsWith(".json")).map(async (file) => {
        try {
          return JSON.parse(await readFile(path.join(LOCAL_DIR, file), "utf8")) as unknown;
        } catch {
          return null;
        }
      }),
    );
    return reviews.filter(isReview);
  } catch {
    return [];
  }
}

async function writeLocal(review: Review) {
  await mkdir(LOCAL_DIR, { recursive: true });
  await writeFile(localPath(review.id), JSON.stringify(review, null, 2), "utf8");
}

export async function listApprovedReviews(): Promise<Review[]> {
  const stored = blobReady() ? await readBlob() : await readLocal();
  const byId = new Map<string, Review>();
  for (const review of seeded) byId.set(review.id, review);
  for (const review of stored) byId.set(review.id, review);
  return [...byId.values()]
    .map((review) =>
      review.provider === "linkedin" && !review.profileUrl
        ? { ...review, profileUrl: fallbackLinkedInProfile(review.name) }
        : review,
    )
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}

export async function publishReview(review: Review) {
  if (blobReady()) {
    if (await blobHas(review.id)) {
      await archiveReview(review);
      return { review, created: false };
    }
    await writeBlob(review);
    await archiveReview(review);
    await snapshotPublishedReviews();
    return { review, created: true };
  }
  const current = await readLocal();
  if (current.some((item) => item.id === review.id)) return { review, created: false };
  await writeLocal(review);
  return { review, created: true };
}

export async function saveInboxReview(review: Review) {
  if (!blobReady()) return;
  try {
    await putReviewJson(`${INBOX_PREFIX}${review.id}.json`, review, false);
  } catch (error) {
    console.error("Review inbox save failed", error);
  }
}

export async function archiveReview(review: Review) {
  if (!blobReady()) return;
  try {
    await putReviewJson(`${ARCHIVE_PREFIX}${review.id}.json`, review, false);
  } catch {
    // Already archived. Never overwrite a kept copy.
  }
}

export async function snapshotPublishedReviews() {
  const reviews = await listApprovedReviews();
  if (!blobReady()) return { reviews, stored: false };
  const day = new Date().toISOString().slice(0, 10);
  try {
    await putReviewJson(`${SNAPSHOT_PREFIX}latest.json`, reviews, true);
  } catch (error) {
    console.error("Review latest snapshot failed", error);
    return { reviews, stored: false };
  }
  try {
    await putReviewJson(`${SNAPSHOT_PREFIX}${day}.json`, reviews, false);
  } catch {
    // Dated copy already exists for today. latest.json still holds the current list.
  }
  return { reviews, stored: true };
}

function safeBlobId(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80) || "reviewer";
}

function sessionBlobPath(provider: string, id: string) {
  return `${SESSION_PREFIX}${provider}-${safeBlobId(id)}.json`;
}

function sessionLocalPath(provider: string, id: string) {
  return path.join(LOCAL_SESSION_DIR, `${provider}-${id}.json`);
}

export async function saveReviewerSession(identity: ReviewIdentity) {
  const body = JSON.stringify({
    provider: identity.provider,
    id: identity.id,
    login: identity.login,
    name: identity.name,
    avatar: identity.avatar ?? "",
    profileUrl: identity.profileUrl,
    email: identity.email ?? "",
  });
  if (blobReady()) {
    await put(sessionBlobPath(identity.provider, identity.id), body, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      cacheControlMaxAge: 0,
    });
    return;
  }
  await mkdir(LOCAL_SESSION_DIR, { recursive: true });
  await writeFile(sessionLocalPath(identity.provider, identity.id), body, "utf8");
}

export async function readReviewerSession(provider: string, id: string): Promise<ReviewIdentity | null> {
  try {
    if (blobReady()) {
      const meta = await head(sessionBlobPath(provider, id));
      const parsed = await readJson(meta.downloadUrl || meta.url);
      if (parsed && typeof parsed === "object" && "provider" in parsed) return parsed as ReviewIdentity;
      return null;
    }
    const parsed = JSON.parse(await readFile(sessionLocalPath(provider, id), "utf8")) as ReviewIdentity;
    return parsed?.provider ? parsed : null;
  } catch {
    return null;
  }
}

export async function persistRemoteAvatar(provider: string, id: string, url: string): Promise<string> {
  if (!url || !blobReady()) return url;
  try {
    const host = new URL(url).hostname;
    if (host.includes("blob.vercel-storage.com") || host === "avatars.githubusercontent.com") return url;
  } catch {
    return url;
  }
  try {
    const response = await fetch(url, {
      headers: { Referer: "https://www.linkedin.com/", Accept: "image/*" },
      redirect: "follow",
      cache: "no-store",
    });
    if (!response.ok) return url;
    const type = (response.headers.get("content-type") || "image/jpeg").split(";")[0];
    if (!type.startsWith("image/")) return url;
    const ext = type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg";
    const stored = await put(`reviews/avatars/${provider}-${safeBlobId(id)}.${ext}`, await response.arrayBuffer(), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: type,
      cacheControlMaxAge: 60 * 60 * 24 * 30,
    });
    return stored.url;
  } catch {
    return url;
  }
}

export async function hydrateIdentity(identity: ReviewIdentity): Promise<ReviewIdentity> {
  const stored = await readReviewerSession(identity.provider, identity.id);
  const name = stored?.name || identity.name;
  const email = stored?.email || identity.email;
  const avatar =
    stored?.avatar ||
    identity.avatar ||
    (identity.provider === "github" && identity.login ? `https://github.com/${identity.login}.png` : "");
  let profileUrl = stored?.profileUrl || identity.profileUrl;
  if (identity.provider === "linkedin" && !profileUrl) {
    profileUrl = fallbackLinkedInProfile(name, email);
  }
  return {
    provider: identity.provider,
    id: identity.id,
    login: stored?.login || identity.login,
    name,
    avatar,
    profileUrl,
    email,
  };
}
