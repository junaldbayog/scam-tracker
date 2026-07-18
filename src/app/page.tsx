import Link from "next/link";
import { prisma } from "@/lib/db";
import { scoreNumber } from "@/lib/scoring";
import { SearchBox } from "@/components/SearchBox";

export const revalidate = 600;

function toSlug(e164: string) {
  return e164.startsWith("+63") ? `0${e164.slice(3)}` : e164.slice(1);
}

export default async function HomePage() {
  const [numberCount, reportCount, voteCount, trending, latest, categories] =
    await Promise.all([
      prisma.phoneNumber.count({ where: { reportCount: { gt: 0 } } }),
      prisma.comment.count({ where: { status: "APPROVED" } }),
      prisma.vote.count(),
      prisma.phoneNumber.findMany({
        where: { reportCount: { gt: 0 }, status: "ACTIVE" },
        orderBy: [{ lastActivityAt: "desc" }],
        take: 10,
      }),
      prisma.comment.findMany({
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { phoneNumber: true, category: true },
      }),
      prisma.category.findMany({ orderBy: { name: "asc" } }),
    ]);

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-line bg-card">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
          <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-harbor">
            Community scam-number registry · Philippines
          </p>
          <h1 className="mt-3 max-w-2xl font-display text-3xl font-extrabold tracking-tight text-ink sm:text-5xl">
            Sino ang tumawag? E-check ang number bago sumagot.
          </h1>
          <p className="mt-4 max-w-xl text-ink-soft">
            Look up any Philippine phone number and see what other people
            experienced — scam calls, fake delivery texts, GCash phishing.
            Free, no sign-up.
          </p>
          <div className="mt-6 max-w-xl">
            <SearchBox />
          </div>
          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm text-ink-soft">
            <span><span className="tel font-semibold text-ink">{numberCount.toLocaleString()}</span> numbers reported</span>
            <span><span className="tel font-semibold text-ink">{reportCount.toLocaleString()}</span> community reports</span>
            <span><span className="tel font-semibold text-ink">{voteCount.toLocaleString()}</span> votes cast</span>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-5xl gap-10 px-4 py-10 lg:grid-cols-[1fr_320px]">
        <div className="space-y-10">
          {/* Trending */}
          <section aria-labelledby="trending-h">
            <h2 id="trending-h" className="font-display text-lg font-bold text-ink">
              Recently reported numbers
            </h2>
            {trending.length === 0 ? (
              <p className="mt-3 rounded-lg border border-dashed border-line-strong bg-card px-4 py-8 text-center text-sm text-ink-soft">
                No reports yet. <Link href="/report" className="font-semibold text-harbor underline">Be the first to report a number</Link>.
              </p>
            ) : (
              <div className="mt-3 overflow-x-auto rounded-lg border border-line bg-card shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-faint">
                      <th className="px-4 py-2.5 font-semibold">Number</th>
                      <th className="px-4 py-2.5 font-semibold">Network</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Reports</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Verdict</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {trending.map((n) => {
                      const s = scoreNumber({
                        scamVotes: n.scamVotes,
                        safeVotes: n.safeVotes,
                        nationalFormat: n.nationalFormat,
                        reportCount: n.reportCount,
                      });
                      return (
                        <tr key={n.id} className="hover:bg-paper">
                          <td className="px-4 py-2.5">
                            <Link href={`/number/${toSlug(n.e164)}`} className="tel font-semibold text-harbor hover:underline">
                              {n.nationalFormat}
                            </Link>
                          </td>
                          <td className="px-4 py-2.5 text-ink-soft">{n.telco ?? "—"}</td>
                          <td className="tel px-4 py-2.5 text-right">{n.reportCount}</td>
                          <td className="px-4 py-2.5 text-right">
                            <span
                              className={`text-xs font-bold uppercase tracking-wide ${
                                s.verdict === "scam"
                                  ? "text-scam"
                                  : s.verdict === "caution"
                                    ? "text-caution"
                                    : s.verdict === "safe"
                                      ? "text-safe"
                                      : "text-ink-faint"
                              }`}
                            >
                              {s.verdict === "unverified" ? "unverified" : s.verdict}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Latest reports */}
          {latest.length > 0 ? (
            <section aria-labelledby="latest-h">
              <h2 id="latest-h" className="font-display text-lg font-bold text-ink">
                Latest reports
              </h2>
              <ul className="mt-3 space-y-3">
                {latest.map((c) => (
                  <li key={c.id} className="rounded-lg border border-line bg-card p-4 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <Link href={`/number/${toSlug(c.phoneNumber.e164)}`} className="tel font-semibold text-harbor hover:underline">
                        {c.phoneNumber.nationalFormat}
                      </Link>
                      {c.category ? (
                        <span className="rounded-full bg-royal-wash px-2 py-0.5 font-semibold text-royal">
                          {c.category.name}
                        </span>
                      ) : null}
                      <time className="text-ink-faint" dateTime={c.createdAt.toISOString()}>
                        {c.createdAt.toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                      </time>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{c.body}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <aside className="space-y-6">
          <section className="rounded-lg border border-line bg-card p-4 shadow-sm">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink-soft">
              Browse by scam type
            </h2>
            <ul className="mt-3 space-y-1.5 text-sm">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link href={`/category/${c.slug}`} className="text-harbor hover:underline">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-lg border border-harbor bg-harbor-wash p-4">
            <h2 className="font-display font-bold text-harbor-deep">
              Got a scam text just now?
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              Report the number in under a minute — no account needed.
            </p>
            <Link
              href="/report"
              className="mt-3 inline-block rounded-md bg-harbor px-4 py-2 text-sm font-semibold text-white hover:bg-harbor-deep"
            >
              Report a number
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
