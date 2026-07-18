/**
 * Minimal, server-only Reddit Data API client for the curation workflow.
 *
 * It deliberately returns only a post URL, title, and text long enough to
 * locate phone numbers. Callers must not persist or publish the Reddit text
 * itself; the title is surfaced only so a human reviewer has context.
 *
 * Access is through Reddit's official, authenticated OAuth Data API — the
 * sanctioned path for this data. We identify ourselves with a truthful,
 * unique user agent and never scrape HTML or evade bot detection.
 */
const SUBREDDIT = "ScammersPH";

// Reddit's rate limit is generous for this low volume, but we still behave:
// transient/rate-limit responses are retried with capped exponential back-off
// so we never hammer the server on a 429 or 5xx.
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const MAX_RETRIES = 4;

type RedditListingResponse = {
  data?: {
    after?: string | null;
    children?: Array<{
      data?: { permalink?: string; selftext?: string; title?: string };
    }>;
  };
};

export type RedditPostForReview = { url: string; title: string; text: string };

function credentials() {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  const userAgent = process.env.REDDIT_USER_AGENT;
  if (!clientId || !clientSecret || !userAgent) return null;
  return { clientId, clientSecret, userAgent };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * fetch() with good-citizen back-off. Retries only rate-limit / transient
 * server errors, honoring a Retry-After header when present, and adds jitter so
 * concurrent runs don't retry in lockstep. Non-retryable responses return as-is.
 */
async function politeFetch(url: string, init: RequestInit): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(url, init);
    if (response.ok || !RETRYABLE_STATUS.has(response.status) || attempt >= MAX_RETRIES) {
      return response;
    }
    const retryAfter = Number(response.headers.get("retry-after"));
    const backoffMs =
      Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1000
        : Math.min(30_000, 1000 * 2 ** attempt) + Math.random() * 1000;
    await sleep(backoffMs);
  }
}

/** Exchange app credentials for a short-lived bearer token (client_credentials). */
async function accessToken(config: NonNullable<ReturnType<typeof credentials>>): Promise<string> {
  const tokenResponse = await politeFetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": config.userAgent,
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!tokenResponse.ok) throw new Error("Reddit did not accept the app credentials.");

  const token = (await tokenResponse.json() as { access_token?: string }).access_token;
  if (!token) throw new Error("Reddit did not return an access token.");
  return token;
}

/** Map one listing page to review-ready posts, filtering to the subreddit. */
function pagePosts(listing: RedditListingResponse): RedditPostForReview[] {
  return (listing.data?.children ?? []).flatMap(({ data }) => {
    if (!data?.permalink || !data.permalink.toLowerCase().startsWith(`/r/${SUBREDDIT.toLowerCase()}/`)) return [];
    const title = data.title ?? "";
    // A hard cap protects downstream consumers from unexpectedly large posts.
    const text = [data.title, data.selftext].filter(Boolean).join("\n").slice(0, 30_000);
    if (!text.trim()) return [];
    return [{ url: `https://www.reddit.com${data.permalink}`, title, text }];
  });
}

export type FetchOptions = {
  /** Posts per listing page (Reddit caps this at 100). */
  limit?: number;
  /** How many pages to walk via the `after` cursor. */
  pages?: number;
  /** Called before sleeping between pages, for CLI progress logging. */
  onPage?: (info: { page: number; posts: number; delayMs: number }) => void;
};

/**
 * Fetch recent text posts through Reddit's authenticated Data API.
 *
 * Walks up to `pages` listing pages. Between pages it waits a randomized
 * 3000–7000ms so we stay well under any per-app rate limit and spread load —
 * the same "respect the server" pacing a manual reader would have.
 */
export async function fetchScammersPhPosts(options: FetchOptions = {}): Promise<RedditPostForReview[]> {
  const config = credentials();
  if (!config) {
    throw new Error("Reddit import is not configured. Add REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, and REDDIT_USER_AGENT.");
  }

  const safeLimit = Math.max(1, Math.min(options.limit ?? 25, 100));
  const pages = Math.max(1, options.pages ?? 1);
  const token = await accessToken(config);

  const all: RedditPostForReview[] = [];
  let after: string | null | undefined;

  for (let page = 0; page < pages; page++) {
    const url = new URL(`https://oauth.reddit.com/r/${SUBREDDIT}/new`);
    url.searchParams.set("limit", String(safeLimit));
    if (after) url.searchParams.set("after", after);

    const listingResponse = await politeFetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}`, "User-Agent": config.userAgent },
      cache: "no-store",
    });
    if (!listingResponse.ok) throw new Error("Could not load recent r/ScammersPH posts from Reddit.");

    const listing = await listingResponse.json() as RedditListingResponse;
    all.push(...pagePosts(listing));
    after = listing.data?.after;

    // Stop early if there are no more pages, and pace remaining requests.
    if (!after || page === pages - 1) break;
    const delayMs = 3000 + Math.floor(Math.random() * 4001); // 3000–7000ms
    options.onPage?.({ page: page + 1, posts: all.length, delayMs });
    await sleep(delayMs);
  }

  return all;
}
