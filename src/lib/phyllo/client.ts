const PHYLLO_API_URL = process.env.PHYLLO_API_URL || "https://api.staging.getphyllo.com";

function getAuthHeader() {
  const id = process.env.PHYLLO_CLIENT_ID;
  const secret = process.env.PHYLLO_CLIENT_SECRET;
  if (!id || !secret) {
    throw new Error("PHYLLO_CLIENT_ID / PHYLLO_CLIENT_SECRET no configurados en el entorno");
  }
  const token = Buffer.from(`${id}:${secret}`).toString("base64");
  return `Basic ${token}`;
}

export async function phylloFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${PHYLLO_API_URL}${path}`, {
    ...options,
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  return res.json();
}

export async function createPhylloUser(name: string, externalId: string) {
  return phylloFetch("/v1/users", {
    method: "POST",
    body: JSON.stringify({ name, external_id: externalId }),
  });
}

export async function createSDKToken(userId: string) {
  return phylloFetch("/v1/sdk-tokens", {
    method: "POST",
    body: JSON.stringify({
      user_id: userId,
      products: ["IDENTITY", "ENGAGEMENT"],
    }),
  });
}

// Connected accounts for a Phyllo user (one per linked social platform).
export async function getPhylloAccounts(phylloUserId: string) {
  return phylloFetch(`/v1/accounts?user_id=${encodeURIComponent(phylloUserId)}&limit=50`, {
    method: "GET",
  });
}

// Profile (IDENTITY product) for a connected account: handle, follower count,
// and engagement metrics. Field shape is logged on first sync to confirm.
export async function getPhylloProfile(accountId: string) {
  return phylloFetch(`/v1/profiles?account_id=${encodeURIComponent(accountId)}`, {
    method: "GET",
  });
}

// Recent published content (ENGAGEMENT product): each item carries per-post
// like / comment / reach counts we average to derive engagement + visibility.
export async function getPhylloContents(accountId: string, limit = 50) {
  return phylloFetch(
    `/v1/social/contents?account_id=${encodeURIComponent(accountId)}&limit=${limit}`,
    { method: "GET" }
  );
}

// The metrics a maison sees on a storyteller, derived from the Phyllo profile +
// recent content. Reach is the clearest "visibility" signal; engagement is the
// audience-quality signal. Stories are excluded so likes/comments are comparable.
export type StorytellerMetrics = {
  imageUrl: string | null;
  bio: string | null;
  website: string | null;
  isBusiness: boolean;
  followers: number | null;
  following: number | null;
  posts: number | null;
  engagementPct: number | null; // (likes + comments) / followers, feed posts
  avgReach: number | null; // avg organic reach per feed post
  avgLikes: number | null;
  avgComments: number | null;
  postsSampled: number;
  syncedAt: string;
};

// profile = one item of /v1/profiles data[]; contents = /v1/social/contents data[]
export function summarizeMetrics(
  profile: Record<string, unknown> | null | undefined,
  contents: Array<Record<string, unknown>> | null | undefined,
  nowIso: string
): { engagementRate: number | null; metrics: StorytellerMetrics } {
  const rep = (profile?.reputation ?? {}) as Record<string, number | null>;
  const followers = (rep.follower_count as number | null) ?? null;

  const feed = (contents ?? []).filter((c) => (c.type as string) !== "STORY");
  let likes = 0;
  let comments = 0;
  let reachSum = 0;
  let reachN = 0;
  for (const it of feed) {
    const e = (it.engagement ?? {}) as Record<string, number | null>;
    likes += e.like_count ?? 0;
    comments += e.comment_count ?? 0;
    if (e.reach_organic_count != null) {
      reachSum += e.reach_organic_count;
      reachN += 1;
    }
  }
  const n = feed.length;
  const avgLikes = n ? Math.round(likes / n) : null;
  const avgComments = n ? Math.round(comments / n) : null;
  const avgReach = reachN ? Math.round(reachSum / reachN) : null;
  const engagementRate =
    n && followers ? (likes + comments) / n / followers : null;

  return {
    engagementRate,
    metrics: {
      imageUrl: (profile?.image_url as string | null) ?? null,
      bio: (profile?.introduction as string | null) ?? null,
      website: (profile?.website as string | null) ?? null,
      isBusiness: Boolean(profile?.is_business),
      followers,
      following: (rep.following_count as number | null) ?? null,
      posts: (rep.content_count as number | null) ?? null,
      engagementPct: engagementRate != null ? Math.round(engagementRate * 1000) / 10 : null,
      avgReach,
      avgLikes,
      avgComments,
      postsSampled: n,
      syncedAt: nowIso,
    },
  };
}
