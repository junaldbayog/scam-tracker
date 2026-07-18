/**
 * MVP import CLI — TrackScam PH
 *
 * Pulls recent r/ScammersPH posts through Reddit's official OAuth Data API
 * (reusing src/lib/reddit.ts), extracts valid PH mobile numbers with the shared
 * libphonenumber-js helper (src/lib/phone.ts), and emits a clean JSON array
 * ready to stage for a human-reviewed DB upsert.
 *
 * Each record: { raw_title, extracted_phone, source_url, scraped_at }.
 *
 * Good-citizen by design:
 *   - Official authenticated API, not HTML scraping. No bot-detection evasion.
 *   - Truthful, identifying User-Agent (REDDIT_USER_AGENT).
 *   - Randomized 3000–7000ms delay between listing pages (in reddit.ts).
 *   - Capped exponential back-off on 429/5xx (in reddit.ts) — never hammers.
 *
 * This JSON is a REVIEW QUEUE, not published content. `raw_title` is included
 * only so a curator has context; the site never publishes Reddit's own text.
 *
 * Usage:
 *   npx tsx scripts/import-reddit.ts [--pages N] [--limit N] [--out FILE]
 *
 * Requires REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USER_AGENT in .env.
 */
import "dotenv/config";
import { writeFile } from "node:fs/promises";
import { fetchScammersPhPosts } from "../src/lib/reddit";
import { extractCandidateNumbers } from "../src/lib/phone";

type ImportRecord = {
  raw_title: string;
  extracted_phone: string; // E.164, e.g. +639171234567
  source_url: string;
  scraped_at: string; // ISO 8601 UTC
};

function parseArgs(argv: string[]) {
  const opts: { pages: number; limit: number; out?: string } = { pages: 1, limit: 25 };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--pages") opts.pages = Math.max(1, Number(argv[++i]) || 1);
    else if (arg === "--limit") opts.limit = Math.max(1, Math.min(Number(argv[++i]) || 25, 100));
    else if (arg === "--out") opts.out = argv[++i];
    else if (arg === "--help" || arg === "-h") {
      console.log("Usage: npx tsx scripts/import-reddit.ts [--pages N] [--limit N] [--out FILE]");
      process.exit(0);
    }
  }
  return opts;
}

async function main() {
  const { pages, limit, out } = parseArgs(process.argv.slice(2));

  const posts = await fetchScammersPhPosts({
    pages,
    limit,
    onPage: ({ page, posts: seen, delayMs }) =>
      // Progress + pacing go to stderr so stdout stays clean JSON for piping.
      console.error(`[import] page ${page} done (${seen} posts) — waiting ${delayMs}ms before next page`),
  });

  const scrapedAt = new Date().toISOString();
  const records: ImportRecord[] = [];
  // Dedupe by (number, source) so one post reported twice yields one row.
  const seen = new Set<string>();

  for (const post of posts) {
    // Extract from the full post text (title + body); each row records the
    // title for reviewer context and the number in canonical E.164.
    for (const parsed of extractCandidateNumbers(post.text)) {
      const key = `${parsed.e164}|${post.url}`;
      if (seen.has(key)) continue;
      seen.add(key);
      records.push({
        raw_title: post.title,
        extracted_phone: parsed.e164,
        source_url: post.url,
        scraped_at: scrapedAt,
      });
    }
  }

  const json = JSON.stringify(records, null, 2);
  if (out) {
    await writeFile(out, json + "\n", "utf8");
    console.error(`[import] wrote ${records.length} record(s) from ${posts.length} post(s) to ${out}`);
  } else {
    // stdout: the JSON array only, so it can be piped into a DB upsert step.
    console.log(json);
    console.error(`[import] ${records.length} record(s) from ${posts.length} post(s)`);
  }
}

main().catch((error) => {
  console.error(`[import] failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
