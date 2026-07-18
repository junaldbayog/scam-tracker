# TrackScam PH

Community-reported scam phone number registry for the Philippines. Anyone can
look up a number, vote **Scam/Safe**, and post a report — no login. The
business model is programmatic SEO: every reported number is an indexable page
targeting "[number] scam" searches, monetized later with ads.

## 1. What it does (plain language)

- **Search any PH number** (any format — `0917…`, `+63…`, dashes/spaces) and land
  on that number's canonical page showing a scam-score verdict, vote tally,
  telco/prefix info, and community reports.
- **Vote scam/safe with one click** — deduplicated per browser, rate-limited per IP.
- **Post reports anonymously** — first-time posters and risky content (links,
  long digit runs, profanity) are held for admin review before publishing.
- **Browse** by prefix (`/prefix/0917`), network (`/telco/globe-tm`), and scam
  type (`/category/gcash-scam`); read editorial anti-scam guides (`/guides`).
- **Number owners can dispute** a listing (`/legal/disputes`); admin can delist,
  which removes the page from public view and search engines.
- **Admin dashboard** (`/admin`, password-protected): moderation queue, dispute
  handling, number management, stats.

## 2. How it connects (architecture & data flow)

- **Next.js 16 (App Router, TypeScript) + Tailwind 4** — one app serves public
  pages, API routes, and admin.
- **Postgres + Prisma 7** (driver adapter `@prisma/adapter-pg`). Local dev DB is
  Docker (`scamtracker-pg`, port 5433). Schema: `prisma/schema.prisma`
  (PhoneNumber, Comment, Vote, Category, DisputeRequest, TelcoPrefix).
- **Data flow (write path):** form/button → `/api/report|vote|comments` (or a
  server action for disputes/admin) → zod validation → honeypot check → rate
  limit (`src/lib/rate-limit.ts`, in-memory) → Turnstile verify (if configured)
  → content screening (`src/lib/moderation.ts`) → Prisma transaction updating
  the row + denormalized counters → `revalidatePath` so the ISR page refreshes.
- **Data flow (read path):** number pages are ISR (revalidate 1h) rendered from
  the slug; the slug is parsed by `src/lib/phone.ts` (libphonenumber-js with PH
  default region) so every format maps to one canonical URL
  (`/number/09171234567`). Pages with zero approved reports render `noindex`.
- **Identity without accounts:** an httpOnly random-UUID cookie (`st_fp`) is
  the vote-dedup fingerprint (DB unique constraint on number+fingerprint);
  IPs are stored only as salted SHA-256 hashes (`src/lib/identity.ts`).
- **SEO layer:** per-page metadata + canonicals, `DiscussionForumPosting`
  JSON-LD on number pages, `Article`/`FAQPage` on guides, dynamic OG images
  (`opengraph-image.tsx`), `robots.txt`, and a sitemap index (`/sitemap.xml`)
  pointing at chunked sitemaps (`/sitemaps/N.xml`, 10k URLs per chunk).
- **Admin auth:** single password (env) → HMAC-signed expiry cookie scoped to
  `/admin` (`src/lib/admin-auth.ts`). No user accounts anywhere.

## 3. Why decisions were made

| Decision | Reasoning |
|---|---|
| Philippines-first, global-ready schema | Uncontested SERPs + Taglish keywords beat competing with 800notes/WhoCalledMe head-on; E.164 storage means other countries are a launch decision, not a rewrite. |
| Next.js + Postgres (vs Astro/Laravel) | SEO is the business → SSR/ISR required; ISR gives static-page speed with community-content freshness; largest ecosystem for later ads/API work. |
| `noindex` until first approved report | Google penalizes scaled thin content; empty pages still render (UX) but stay out of the index until they have substance. |
| National-format URLs (`/number/09171234567`) | Matches how Filipinos actually search; E.164 stays the DB key with one redirect to canonical. |
| No login for voting/commenting | Zero-friction UGC is the growth engine; abuse handled by fingerprint cookie + IP-hash rate limits + moderation holds instead of accounts. |
| Cookie fingerprint (not FingerprintJS) | Dependency-free and privacy-cheap; resettable, but the unique DB constraint + IP rate limit + moderation queue cap the damage; can upgrade later. |
| Comments publish immediately | Zero-friction posting maximizes reports (the growth input). Only link-bearing comments are held (anti-phishing); abusive/false comments are removed reactively by an admin from the "Recently published" list. |
| Salted IP hashes, never raw IPs | PH Data Privacy Act exposure minimized; rate limiting works fine on hashes. |
| Dispute → delist flow | Legal safety valve: numbers are DELISTED (page removed + noindexed), not deleted, preserving an audit trail. |
| Seed data only from public advisories | Fabricated or privately-sourced "scam numbers" would be defamation; `prisma/seed-numbers.json` requires a published source per entry. |
| In-memory rate limiter | Single-instance deploys need no Redis; the interface matches Upstash so it's a drop-in swap when scaling out. |
| Ads deferred | AdSense on UGC needs moderation maturity + traffic first; ad slots can be added to number pages without layout shift later. |

## Running locally

```bash
docker start scamtracker-pg   # Postgres 16 on :5433 (first time: see below)
npm install
npx prisma migrate dev        # apply migrations
npx prisma db seed            # telco prefixes + categories
npx tsx prisma/seed-content.ts --demo   # optional: demo numbers for testing
npm run dev
```

First-time Postgres container:

```bash
docker run -d --name scamtracker-pg -e POSTGRES_PASSWORD=scamtracker \
  -e POSTGRES_DB=scamtracker -p 5433:5432 --restart unless-stopped postgres:16-alpine
```

Admin: `/admin/login` — password from `ADMIN_PASSWORD` in `.env`.

## Testing standard (all four must pass before handoff)

1. **Happy path** — report → vote → comment → visible on page; all number
   formats resolve to one canonical URL.
2. **Messy inputs** — partial/dashed/spaced numbers, landlines, non-PH numbers.
3. **Edge cases** — 0-report pages (`noindex` + invite state), duplicate votes
   (blocked by constraint), vote changes, delisted numbers.
4. **Invalid inputs** — bad JSON, wrong enum values, too-short/too-long bodies,
   honeypot submissions (fake success, nothing stored), XSS strings (rendered
   escaped), rate-limit breach (429 + friendly UI message).

Status: all four tiers verified 2026-07-18 against the production build
(API-level via curl, UI + admin flows via browser).

## Automated tests (Vitest)

```bash
npm test          # unit tests — no server or DB needed (55 tests)

# integration tests hit a running app; disable rate limiting so re-runs
# don't 429 on the shared test IP:
RATE_LIMIT_DISABLED=1 npm run dev    # in one terminal (or: npm run start)
npm run test:api                     # in another (14 tests)
```

- **Unit** (`tests/unit/`): phone parsing/normalization across formats,
  scam-score verdicts and boundaries, comment moderation (holds, PII stripping,
  rejects), the sliding-window rate limiter, and admin session-token/password
  checks. Pure functions — fast, deterministic, run in CI without infra.
- **Integration** (`tests/integration/`): drives the real API routes and
  page/SEO endpoints — search→canonical redirects, `noindex` on unknown numbers,
  sitemap index, admin auth guard, vote dedup/flip, honeypot, and validation
  rejections. Uses a random test number per run so it's re-runnable.
- `RATE_LIMIT_DISABLED=1` is a test-only escape hatch read in
  `src/lib/rate-limit.ts`; never set it in production.

## Growth strategy (why the flywheel, not seeding)

The original plan assumed we could seed number pages from public scam
advisories. **Research (2026-07-18) found that premise is wrong:** PH
authorities (NTC, PNP-ACG, BSP) and banks publish scam *descriptions and
reporting hotlines*, never structured lists of the actual sender numbers. Even
the closest analog, ScamWatch Pilipinas, is an education/reporting site, not a
searchable number database. So there is no dataset to seed from.

Revised approach — a distribution flywheel instead of a seeded corpus:

1. **Guides are the SEO ignition.** The 10 guides in `src/lib/guides.ts` are
   real, authoritative, non-defamatory content that ranks with zero number data.
2. **Numbers populate organically** via the report/vote flow — every number is
   then a genuine, timestamped user report, which is more legally defensible
   than republishing third-party accusations.
3. **Social seeds the first traffic.** Share buttons on every number page
   (`src/components/ShareButtons.tsx`) — native Web Share on mobile plus
   Facebook / Viber / X / copy-link fallbacks — turn visitors into distributors;
   shared links carry the dynamic OG card. Pair with a Facebook page posting
   "scammer of the week" to break the cold-start trap.
4. **Monetize with affiliate, not display ads** (deferred): call-blocker apps
   (Whoscall/Truecaller), mobile security, on guides and number pages. PH
   display RPMs are too low to matter at achievable traffic.

Number-seeding is done via **human-in-the-loop curation**, not scraping. The
admin "Add numbers" tool (`/admin/curate`) lets a reviewer paste text they've
sourced; the app extracts only the phone numbers (never storing/publishing the
pasted content), shows an honest per-number signal (already-corroborated on the
site vs. new vs. conflicting votes vs. unknown prefix), and the human decides
each one. Published entries use the reviewer's own neutral wording, are tagged
`seedSource: admin-curated`, and carry the same "unverified community report"
framing + dispute path as any report.

We deliberately do NOT auto-scrape Reddit/FB: automated scraping breaks those
platforms' terms and republishes users' copyrighted posts, and bulk-copying
unverified accusations risks defaming innocents (recycled SIMs, spoofed IDs) —
which also undermines the anti-scam mission. The curation tool keeps a human
judging each number and keeps the site the publisher of its own neutral words,
not of scraped content.

## Launch checklist (production)

- [ ] Managed Postgres (Neon/Supabase) → `DATABASE_URL`
- [ ] Strong `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `IP_HASH_SALT`
- [ ] Turnstile keys (site + secret)
- [ ] `NEXT_PUBLIC_SITE_URL` = real domain; submit `/sitemap.xml` to Search Console
- [ ] Populate `prisma/seed-numbers.json` from public advisories, run seeder
- [ ] Swap in Upstash Redis rate limiting if deploying to multi-instance/serverless
      (in-memory limiter resets per instance — on Vercel this means limits are
      per-lambda and weak; do this before real traffic)
- [ ] Review legal pages with counsel before scale
