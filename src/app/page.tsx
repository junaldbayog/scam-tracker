import Link from "next/link";
import { prisma } from "@/lib/db";
import { scoreNumber } from "@/lib/scoring";
import { SearchBox } from "@/components/SearchBox";

export const revalidate = 600;

function toSlug(e164: string) {
  return e164.startsWith("+63") ? `0${e164.slice(3)}` : e164.slice(1);
}

// Popular PH mobile prefixes people search for ("what network is 0917",
// "0995 scam"). We don't assert the network here — the prefix page detects it —
// so the anchor text stays accurate while still building internal links.
const POPULAR_PREFIXES = [
  "0905", "0906", "0915", "0916", "0917", "0918", "0919", "0920",
  "0921", "0927", "0928", "0929", "0938", "0939", "0945", "0947",
  "0949", "0951", "0961", "0963", "0965", "0966", "0967", "0975",
  "0977", "0991", "0995", "0997", "0813", "0895",
];

const TELCOS = [
  { slug: "globe-tm", label: "Globe / TM numbers" },
  { slug: "smart-tnt", label: "Smart / TNT numbers" },
  { slug: "dito", label: "DITO numbers" },
  { slug: "sun", label: "Sun numbers" },
];

// Curated guide links (real pages under /guides). Anchor text is written for the
// long-tail queries Filipinos actually type, in English and Taglish.
const GUIDES = [
  { slug: "paano-malalaman-kung-scam-ang-text", title: "Paano malalaman kung scam ang text" },
  { slug: "how-to-report-scam-number-ntc", title: "How to report a scam number to the NTC" },
  { slug: "gcash-scams-how-they-work", title: "How GCash scams work — and how to avoid them" },
  { slug: "fake-delivery-text-scams", title: "Fake delivery (LBC / J&T) text scams explained" },
  { slug: "loan-app-harassment", title: "Dealing with online loan-app harassment" },
  { slug: "what-to-do-if-scammed", title: "What to do if you were scammed" },
];

// FAQ content is rendered visibly AND emitted as FAQPage JSON-LD so it can
// qualify for rich results. Answers stay accurate — no guarantees, and the
// site's data is always framed as community-reported and unverified.
const FAQS: { q: string; a: string }[] = [
  {
    q: "How do I check if a Philippine phone number is a scam?",
    a: "Type the number into the search box on this page. If other people have reported it, you'll see their community reports and a verdict based on how many marked it a scam or safe. If a number has no reports yet, that does not mean it is safe — new SIMs are used constantly, so still trust your judgment.",
  },
  {
    q: "Paano malalaman kung scammer ang isang number?",
    a: "I-search lang ang number dito sa TrackScam PH. Makikita mo kung may ibang nag-report na scam ang number na 'yan, at kung anong klaseng scam ito — GCash phishing, pekeng delivery, sextortion, at iba pa. Kung wala pang report, mag-ingat pa rin at huwag magbigay ng OTP o personal na impormasyon.",
  },
  {
    q: "Is it safe to answer calls or texts from unknown numbers?",
    a: "Not automatically. Legitimate callers usually leave a voicemail or a clear message. If you're unsure, let it ring, then search the number here before replying. Never share your OTP, MPIN, GCash PIN, or bank details with anyone who contacts you first.",
  },
  {
    q: "How do I report a scam text to the authorities in the Philippines?",
    a: "You can report a scam number to the NTC and forward spam texts to your telco (Globe, Smart, and DITO accept spam reports). You can also add the number here so other Filipinos get warned — it takes under a minute and needs no account.",
  },
  {
    q: "What are the most common scams in the Philippines right now?",
    a: "The reports we see most often involve GCash and e-wallet phishing, fake delivery notices, sextortion and blackmail, investment and crypto schemes, online-shopping non-delivery, loan-app harassment, and 'you won a raffle' prize scams. Browse any scam type below to see reported numbers.",
  },
  {
    q: "Is TrackScam PH free to use?",
    a: "Yes. TrackScam PH is a free, non-profit, open-source community project. You don't need to sign up to search a number or file a report.",
  },
  {
    q: "The number that texted me is not listed here. Does that mean it's safe?",
    a: "No. Scammers rotate through cheap, newly registered SIMs, so a number can be brand new and still be a scam. A number with no reports simply hasn't been reported yet — stay cautious and consider being the first to report it.",
  },
];

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

      {/* How it works */}
      <section aria-labelledby="how-h" className="border-t border-line bg-card">
        <div className="mx-auto max-w-5xl px-4 py-12">
          <h2 id="how-h" className="font-display text-2xl font-bold text-ink">
            How to check if a number is a scam
          </h2>
          <p className="mt-2 max-w-2xl text-ink-soft">
            TrackScam PH is a free lookup for suspicious Philippine phone numbers.
            Whether it&apos;s an unknown call, a GCash phishing text, or a
            &ldquo;your parcel is on hold&rdquo; message, here&apos;s how to check
            it in seconds.
          </p>
          <ol className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              { n: "1", t: "Search the number", d: "Paste the 09XX number or +63 format into the search box. Works for calls and texts." },
              { n: "2", t: "Read the reports", d: "See what other Filipinos experienced and a community verdict — scam, caution, or safe." },
              { n: "3", t: "Report what you got", d: "Add your own report in under a minute so the next person gets warned. No sign-up." },
            ].map((s) => (
              <li key={s.n} className="rounded-lg border border-line bg-paper p-4">
                <span className="font-display text-sm font-bold text-harbor">Step {s.n}</span>
                <h3 className="mt-1 font-display font-bold text-ink">{s.t}</h3>
                <p className="mt-1 text-sm text-ink-soft">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Common scams — category grid with descriptions (rich internal linking) */}
      {categories.length > 0 ? (
        <section aria-labelledby="scams-h" className="border-t border-line">
          <div className="mx-auto max-w-5xl px-4 py-12">
            <h2 id="scams-h" className="font-display text-2xl font-bold text-ink">
              Common scams in the Philippines
            </h2>
            <p className="mt-2 max-w-2xl text-ink-soft">
              Filipinos are targeted by many kinds of SMS, call, and e-commerce
              fraud. Tap a scam type to see reported numbers and how each one works.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/category/${c.slug}`}
                  className="group rounded-lg border border-line bg-card p-4 shadow-sm transition hover:border-harbor"
                >
                  <h3 className="font-display font-bold text-ink group-hover:text-harbor">
                    {c.name}
                    {c.nameFil && c.nameFil !== c.name ? (
                      <span className="ml-1.5 text-sm font-semibold text-ink-faint">({c.nameFil})</span>
                    ) : null}
                  </h3>
                  {c.blurb ? (
                    <p className="mt-1 line-clamp-3 text-sm text-ink-soft">{c.blurb}</p>
                  ) : null}
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Networks & prefixes */}
      <section aria-labelledby="net-h" className="border-t border-line bg-card">
        <div className="mx-auto max-w-5xl px-4 py-12">
          <h2 id="net-h" className="font-display text-2xl font-bold text-ink">
            Find a number&apos;s network and prefix
          </h2>
          <p className="mt-2 max-w-2xl text-ink-soft">
            Wondering what network a number belongs to, or which telco uses a
            prefix like 0917 or 0995? Browse by carrier or by mobile prefix.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {TELCOS.map((t) => (
              <Link
                key={t.slug}
                href={`/telco/${t.slug}`}
                className="rounded-full border border-line bg-paper px-3 py-1.5 text-sm font-semibold text-harbor hover:border-harbor"
              >
                {t.label}
              </Link>
            ))}
          </div>
          <h3 className="mt-6 font-display text-sm font-bold uppercase tracking-wide text-ink-soft">
            Popular mobile prefixes
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {POPULAR_PREFIXES.map((p) => (
              <Link
                key={p}
                href={`/prefix/${p}`}
                className="tel rounded-md border border-line bg-paper px-2.5 py-1 text-sm text-ink-soft hover:border-harbor hover:text-harbor"
              >
                {p}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Guides */}
      <section aria-labelledby="guides-h" className="border-t border-line">
        <div className="mx-auto max-w-5xl px-4 py-12">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="guides-h" className="font-display text-2xl font-bold text-ink">
              Scam-safety guides
            </h2>
            <Link href="/guides" className="text-sm font-semibold text-harbor hover:underline">
              All guides →
            </Link>
          </div>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {GUIDES.map((g) => (
              <li key={g.slug}>
                <Link
                  href={`/guides/${g.slug}`}
                  className="block rounded-lg border border-line bg-card p-4 shadow-sm transition hover:border-harbor"
                >
                  <span className="font-display font-semibold text-ink">{g.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq-h" className="border-t border-line bg-card">
        <div className="mx-auto max-w-3xl px-4 py-12">
          <h2 id="faq-h" className="font-display text-2xl font-bold text-ink">
            Frequently asked questions
          </h2>
          <dl className="mt-6 space-y-3">
            {FAQS.map((f) => (
              <div key={f.q} className="rounded-lg border border-line bg-paper p-4">
                <dt className="font-display font-bold text-ink">{f.q}</dt>
                <dd className="mt-2 text-sm text-ink-soft">{f.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* FAQPage structured data for rich results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQS.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        }}
      />
    </div>
  );
}
