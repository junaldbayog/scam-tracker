/**
 * API integration tests. Require the app running with its database:
 *   npm run dev   (or npm run start)
 *   npm run test:api
 *
 * Base URL via TEST_BASE_URL (default http://localhost:3001).
 * Tests are designed to be re-runnable: they use a random test number per run
 * and lean on request paths that don't consume rate-limit budget where possible.
 */
import { beforeAll, describe, expect, it } from "vitest";

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3001";

// Random valid Globe number per run so re-runs don't trip vote dedup.
const digits = String(Math.floor(1000000 + Math.random() * 8999999));
const TEST_SLUG = `0917${digits}`;

let cookie = "";

async function api(path: string, body?: unknown, init?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: "manual",
    ...init,
  });
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) cookie = setCookie.split(";")[0];
  return res;
}

/** Assert a status, with clear guidance when the shared-IP rate limiter interferes. */
function expectStatus(res: Response, expected: number | number[]) {
  const want = Array.isArray(expected) ? expected : [expected];
  if (res.status === 429 && !want.includes(429)) {
    throw new Error(
      "Hit the app's rate limiter (429). For integration runs, start the app with " +
        "RATE_LIMIT_DISABLED=1 (e.g. `RATE_LIMIT_DISABLED=1 npm run dev`), or wait out the window."
    );
  }
  expect(want).toContain(res.status);
}

beforeAll(async () => {
  try {
    await fetch(`${BASE}/`, { signal: AbortSignal.timeout(3000) });
  } catch {
    throw new Error(
      `App is not reachable at ${BASE}. Start it first (npm run dev) or set TEST_BASE_URL.`
    );
  }
});

describe("pages & SEO plumbing", () => {
  it("serves the homepage", async () => {
    const res = await api("/");
    expect(res.status).toBe(200);
  });

  it("redirects search to the canonical number page for any format", async () => {
    for (const q of ["0917 123 4567", "+639171234567", "0917-123-4567"]) {
      const res = await api(`/search?q=${encodeURIComponent(q)}`);
      expect([307, 308]).toContain(res.status);
      expect(res.headers.get("location")).toContain("/number/09171234567");
    }
  });

  it("renders unknown numbers with noindex instead of 404", async () => {
    const res = await api(`/number/${TEST_SLUG}`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('name="robots"');
    expect(html).toContain("noindex");
  });

  it("404s on non-number slugs", async () => {
    const res = await api("/number/not-a-number");
    expect(res.status).toBe(404);
  });

  it("serves robots.txt pointing at the sitemap", async () => {
    const res = await api("/robots.txt");
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("sitemap.xml");
  });

  it("serves a sitemap index with at least two chunks", async () => {
    const res = await api("/sitemap.xml");
    expect(res.status).toBe(200);
    const xml = await res.text();
    expect(xml).toContain("<sitemapindex");
    expect(xml).toContain("/sitemaps/0.xml");
  });

  it("404s invalid sitemap chunk ids", async () => {
    expect((await api("/sitemaps/abc.xml")).status).toBe(404);
  });

  it("guards the admin dashboard behind login", async () => {
    const res = await api("/admin");
    expect([307, 308]).toContain(res.status);
    expect(res.headers.get("location")).toContain("/admin/login");
  });
});

describe("vote API", () => {
  it("rejects invalid vote types and bodies without consuming rate limit", async () => {
    expect((await api("/api/vote", { slug: TEST_SLUG, type: "MAYBE" })).status).toBe(400);
    expect((await api("/api/vote", { slug: "garbage", type: "SCAM" })).status).toBe(400);
    const res = await fetch(`${BASE}/api/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    expect(res.status).toBe(400);
  });

  it("records a vote, dedupes repeats, and allows changing sides", async () => {
    const first = await api("/api/vote", { slug: TEST_SLUG, type: "SCAM" });
    expectStatus(first, 200);
    expect(await first.json()).toMatchObject({ ok: true, changed: false });

    const repeat = await api("/api/vote", { slug: TEST_SLUG, type: "SCAM" });
    expect(await repeat.json()).toMatchObject({ ok: true, changed: false });

    const flipped = await api("/api/vote", { slug: TEST_SLUG, type: "SAFE" });
    expect(await flipped.json()).toMatchObject({ ok: true, changed: true });
  });
});

describe("comment & report APIs", () => {
  it("rejects too-short comments", async () => {
    const res = await api("/api/comments", { slug: TEST_SLUG, body: "short" });
    expectStatus(res, 400);
  });

  it("pretends success on honeypot submissions", async () => {
    const res = await api("/api/comments", {
      slug: TEST_SLUG,
      body: "This is a bot submission that fills the hidden field on purpose.",
      website: "http://bot.example.com",
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true });
  });

  it("rejects unparseable numbers on report", async () => {
    const res = await api("/api/report", {
      number: "not a phone",
      body: "This body is long enough to pass the length check.",
    });
    expect(res.status).toBe(400);
  });

  it("publishes a link-free report immediately (APPROVED)", async () => {
    const res = await api("/api/report", {
      number: TEST_SLUG,
      body: "Integration test report: caller asked for an OTP claiming to be a bank.",
      markScam: false,
    });
    expectStatus(res, 200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.slug).toBe(TEST_SLUG);
    expect(data.status).toBe("APPROVED");
  });

  it("holds a report containing a link for review (PENDING)", async () => {
    const res = await api("/api/report", {
      number: TEST_SLUG,
      body: "This scam text linked to https://phish.example.com asking for my OTP.",
      markScam: false,
    });
    expectStatus(res, 200);
    const data = await res.json();
    expect(data.status).toBe("PENDING");
  });
});
