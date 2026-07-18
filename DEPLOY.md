# Deploying TrackScam PH (trackscam.org)

Target stack: **Vercel** (app) + **Neon** (Postgres) + **Cloudflare/Porkbun** (domain).
At this scale it's effectively free: Vercel Hobby + Neon Free + ~$10/yr domain.

The code is deploy-ready: `postinstall` runs `prisma generate`, Node is pinned to
20+, and the DB uses the `@prisma/adapter-pg` driver which works with Neon.

---

## 1. Buy the domain (~$10/yr)

Register **trackscam.org** at **Cloudflare Registrar** (at-cost) or **Porkbun**.
Turn on WHOIS privacy (free at both). 1 year is fine.

## 2. Create the database (Neon, free)

1. neon.tech → new project, region **Singapore** (closest to PH).
2. Copy **two** connection strings from the dashboard:
   - **Pooled** (host contains `-pooler`) → for the running app.
   - **Direct** (no `-pooler`) → for running migrations.

## 3. Run migrations + seed against Neon (once, from your machine)

```bash
# Use the DIRECT url for migrations:
DATABASE_URL="<neon-direct-url>" npm run db:deploy      # applies migrations
DATABASE_URL="<neon-direct-url>" npx prisma db seed     # telco prefixes + categories (REQUIRED)
```

Do **not** run `prisma/seed-content.ts --demo` in production — that inserts fake
demo numbers. Real numbers come from users and the admin curation tool.

## 4. Push to GitHub

```bash
gh repo create trackscam --private --source=. --push   # or add a remote manually
```

(Currently on branch `feat/trackscam-mvp`; merge to `main` first if you want.)

## 5. Deploy on Vercel

1. vercel.com → New Project → import the GitHub repo. Framework auto-detects Next.js.
2. Add **Environment Variables** (Production):

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | Neon **pooled** url (the `-pooler` one) |
   | `ADMIN_PASSWORD` | a strong password |
   | `ADMIN_SESSION_SECRET` | long random string (`openssl rand -hex 32`) |
   | `IP_HASH_SALT` | random string (`openssl rand -hex 16`) |
   | `NEXT_PUBLIC_SITE_URL` | `https://trackscam.org` |
   | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | (optional) Cloudflare Turnstile site key |
   | `TURNSTILE_SECRET_KEY` | (optional) Turnstile secret |
   | `REDDIT_CLIENT_ID` / `REDDIT_CLIENT_SECRET` / `REDDIT_USER_AGENT` | (optional) for the admin Reddit-import feature |

3. Deploy.

## 6. Point the domain at Vercel

Vercel → Project → Settings → Domains → add `trackscam.org` and `www.trackscam.org`.
Vercel shows the DNS records to set (an `A`/`ALIAS` for the apex + `CNAME` for www).
Add them at your registrar's DNS. HTTPS is issued automatically. Set `www` → apex redirect.

## 7. Go-live checklist

- [ ] `ADMIN_PASSWORD` / `ADMIN_SESSION_SECRET` / `IP_HASH_SALT` are strong & unique (not the dev values).
- [ ] `NEXT_PUBLIC_SITE_URL=https://trackscam.org` (drives canonicals, sitemap, OG).
- [ ] Seed ran (categories + telco prefixes exist).
- [ ] Google **Search Console**: verify the domain, submit `https://trackscam.org/sitemap.xml`, set geotargeting → Philippines.
- [ ] (Recommended) Cloudflare **Turnstile** keys, so comment spam is captcha-gated in prod.

## Known follow-up before real traffic

The rate limiter (`src/lib/rate-limit.ts`) is **in-memory**, so on Vercel's
serverless functions each instance has its own counter — limits are weak and
reset often. Fine for launch/testing; swap to **Upstash Redis** (same interface)
before you drive real traffic. Ask and I'll wire it up.
