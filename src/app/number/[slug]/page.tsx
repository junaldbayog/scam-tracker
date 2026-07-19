import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { parseNumber, slugToQuery } from "@/lib/phone";
import { scoreNumber } from "@/lib/scoring";
import { isIndexable } from "@/lib/visibility";
import { VerdictPlate } from "@/components/VerdictPlate";
import { VoteButtons } from "@/components/VoteButtons";
import { CommentForm } from "@/components/CommentForm";
import { ShareButtons } from "@/components/ShareButtons";
import { GotThisToo } from "@/components/GotThisToo";

export const revalidate = 3600;
export const dynamicParams = true;
export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

async function loadNumber(slug: string) {
  const parsed = parseNumber(slugToQuery(decodeURIComponent(slug)));
  if (!parsed) return null;
  const record = await prisma.phoneNumber.findUnique({
    where: { e164: parsed.e164 },
    include: {
      comments: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { category: true },
      },
    },
  });
  return { parsed, record };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await loadNumber(slug);
  if (!data) return { title: "Number not found" };
  const { parsed, record } = data;
  const reportCount = record?.reportCount ?? 0;
  // Indexable once it has any report or an official source; empty/non-active
  // numbers stay noindex (see visibility.ts).
  const indexable = record ? isIndexable(record) : false;
  return {
    title: `${parsed.slug} — Scam or Legit? ${reportCount > 0 ? `${reportCount} Report${reportCount === 1 ? "" : "s"}` : "Check Reports"}`,
    description: `Is ${parsed.nationalFormat} a scam? See community reports, scam votes, and comments for this ${record?.telco ?? "Philippine"} number. Vote and report for free — no sign-up.`,
    alternates: { canonical: `/number/${parsed.slug}` },
    robots: indexable ? undefined : { index: false, follow: true },
  };
}

const WHAT_TO_DO = [
  ["Don't reply or click links", "Scammers confirm active numbers through replies and track link clicks."],
  ["Block the number", "Use your phone's built-in block feature after reporting it here."],
  ["Report to your telco", "Forward scam texts free of charge: Globe 7726 (SPAM), Smart 7726."],
  ["Report to authorities", "NTC accepts complaints at consumer@ntc.gov.ph; for money lost, file with PNP-ACG or NBI Cybercrime."],
] as const;

export default async function NumberPage({ params }: Props) {
  const { slug } = await params;
  const data = await loadNumber(slug);
  if (!data) notFound();
  const { parsed, record } = data;

  // One canonical URL per number.
  if (slug !== parsed.slug) redirect(`/number/${parsed.slug}`);

  if (record?.status === "DELISTED") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold">This page has been removed</h1>
        <p className="mt-3 text-ink-soft">
          Reports for this number were taken down after a review. See our{" "}
          <Link href="/legal/disputes" className="text-harbor underline">dispute policy</Link>.
        </p>
      </div>
    );
  }

  const comments = record?.comments ?? [];
  const categoryCounts = new Map<string, number>();
  for (const c of comments) {
    if (c.category) categoryCounts.set(c.category.name, (categoryCounts.get(c.category.name) ?? 0) + 1);
  }
  const topCategory = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const score = scoreNumber({
    scamVotes: record?.scamVotes ?? 0,
    safeVotes: record?.safeVotes ?? 0,
    nationalFormat: parsed.nationalFormat,
    telco: record?.telco,
    reportCount: record?.reportCount ?? 0,
    topCategory,
  });

  const related = record
    ? await prisma.phoneNumber.findMany({
        where: { prefix: parsed.prefix, reportCount: { gt: 0 }, status: "ACTIVE", NOT: { id: record.id } },
        orderBy: { lastActivityAt: "desc" },
        take: 6,
        select: { e164: true, nationalFormat: true, scamVotes: true, safeVotes: true, reportCount: true },
      })
    : [];

  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  const shareMessage =
    score.verdict === "scam"
      ? `⚠️ ${parsed.nationalFormat} has been reported as a SCAM on TrackScam PH. Check before you answer:`
      : score.verdict === "safe"
        ? `${parsed.nationalFormat} is reported as safe on TrackScam PH. Check any number here:`
        : `Have you been called or texted by ${parsed.nationalFormat}? Check and report it on TrackScam PH:`;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const jsonLd =
    comments.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "DiscussionForumPosting",
          headline: `Reports for phone number ${parsed.nationalFormat}`,
          text: score.summary,
          url: `${siteUrl}/number/${parsed.slug}`,
          datePublished: record?.firstReportedAt.toISOString(),
          dateModified: record?.lastActivityAt.toISOString(),
          author: { "@type": "Organization", name: "TrackScam PH community" },
          interactionStatistic: {
            "@type": "InteractionCounter",
            interactionType: "https://schema.org/CommentAction",
            userInteractionCount: record?.reportCount ?? 0,
          },
          comment: comments.slice(0, 10).map((c) => ({
            "@type": "Comment",
            text: c.body,
            dateCreated: c.createdAt.toISOString(),
            author: { "@type": "Person", name: c.displayName },
          })),
        }
      : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ) : null}
      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-ink-faint">
        <Link href="/" className="hover:text-harbor">Home</Link>
        <span className="mx-1.5">/</span>
        <Link href={`/prefix/${parsed.prefix}`} className="hover:text-harbor">
          {parsed.prefix} numbers
        </Link>
        <span className="mx-1.5">/</span>
        <span className="tel text-ink-soft">{parsed.slug}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <VerdictPlate nationalFormat={parsed.nationalFormat} telco={record?.telco} score={score} />

          <p className="text-sm leading-relaxed text-ink-soft">{score.summary}</p>

          <div className="rounded-lg border border-line bg-card p-4 shadow-sm sm:p-5">
            <VoteButtons slug={parsed.slug} />
          </div>

          <GotThisToo slug={parsed.slug} />

          <ShareButtons message={shareMessage} slug={parsed.slug} />

          <section aria-labelledby="reports-h">
            <div className="flex items-baseline justify-between">
              <h2 id="reports-h" className="font-display text-lg font-bold text-ink">
                Reports {comments.length > 0 ? `(${record?.reportCount})` : ""}
              </h2>
            </div>

            {comments.length === 0 ? (
              <p className="mt-3 rounded-lg border border-dashed border-line-strong bg-card px-4 py-6 text-center text-sm text-ink-soft">
                No reports yet for this number. If it called or texted you, describe
                what happened below — your report helps the next person who searches it.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {comments.map((c) => (
                  <li key={c.id} className="rounded-lg border border-line bg-card p-4 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-semibold text-ink">{c.displayName}</span>
                      {c.category ? (
                        <span className="rounded-full bg-royal-wash px-2 py-0.5 font-semibold text-royal">
                          {c.category.name}
                        </span>
                      ) : null}
                      <time dateTime={c.createdAt.toISOString()} className="text-ink-faint">
                        {c.createdAt.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}
                      </time>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-ink">{c.body}</p>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-5 rounded-lg border border-line bg-card p-4 shadow-sm sm:p-5">
              <h3 className="font-display font-bold text-ink">Add your report</h3>
              <p className="mb-3 mt-1 text-xs text-ink-faint">
                No account needed. Don't include your own personal or account details.
              </p>
              <CommentForm slug={parsed.slug} categories={categories} />
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-lg border border-line bg-card p-4 shadow-sm">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink-soft">
              If this number contacted you
            </h2>
            <ol className="mt-3 space-y-3">
              {WHAT_TO_DO.map(([title, body], i) => (
                <li key={title} className="flex gap-3 text-sm">
                  <span className="tel mt-0.5 text-ink-faint">{i + 1}.</span>
                  <span>
                    <span className="font-semibold text-ink">{title}.</span>{" "}
                    <span className="text-ink-soft">{body}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-lg border border-line bg-card p-4 shadow-sm">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink-soft">
              Number details
            </h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-soft">Network</dt>
                <dd className="font-semibold">{record?.telco ?? "Unknown"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-soft">Prefix</dt>
                <dd>
                  <Link href={`/prefix/${parsed.prefix}`} className="tel font-semibold text-harbor hover:underline">
                    {parsed.prefix}
                  </Link>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-soft">International</dt>
                <dd className="tel">{parsed.e164}</dd>
              </div>
              {record ? (
                <div className="flex justify-between">
                  <dt className="text-ink-soft">First reported</dt>
                  <dd>{record.firstReportedAt.toLocaleDateString("en-PH", { year: "numeric", month: "short" })}</dd>
                </div>
              ) : null}
            </dl>
          </section>

          {related.length > 0 ? (
            <section className="rounded-lg border border-line bg-card p-4 shadow-sm">
              <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink-soft">
                Recently reported {parsed.prefix} numbers
              </h2>
              <ul className="mt-3 divide-y divide-line">
                {related.map((r) => {
                  const s = scoreNumber({
                    scamVotes: r.scamVotes,
                    safeVotes: r.safeVotes,
                    nationalFormat: r.nationalFormat,
                    reportCount: r.reportCount,
                  });
                  const rslug = r.e164.startsWith("+63") ? `0${r.e164.slice(3)}` : r.e164.slice(1);
                  return (
                    <li key={r.e164}>
                      <Link
                        href={`/number/${rslug}`}
                        className="flex items-center justify-between py-2 text-sm hover:text-harbor"
                      >
                        <span className="tel">{r.nationalFormat}</span>
                        <span
                          className={`text-xs font-semibold ${
                            s.verdict === "scam" ? "text-scam" : s.verdict === "safe" ? "text-safe" : "text-ink-faint"
                          }`}
                        >
                          {s.totalVotes > 0 ? `${s.scamPct}% scam` : `${r.reportCount} report${r.reportCount === 1 ? "" : "s"}`}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          <section className="rounded-lg border border-line-strong bg-card p-4 shadow-sm">
            <h2 className="font-display text-sm font-bold text-ink">
              Is this your number?
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-ink-soft">
              Reports here are community submissions, not verified facts. If a
              report about your number is false or unfair, ask us to review it.
            </p>
            <Link
              href={`/legal/disputes?number=${parsed.slug}`}
              className="mt-3 inline-block rounded-md border border-harbor px-3 py-1.5 text-sm font-semibold text-harbor hover:bg-harbor hover:text-white"
            >
              Request a review
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
