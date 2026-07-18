import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { TELCO_SLUGS } from "@/lib/telco";
import { NumberTable } from "@/components/NumberTable";

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return Object.keys(TELCO_SLUGS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const telco = TELCO_SLUGS[slug];
  if (!telco) return { title: "Network not found" };
  return {
    title: `${telco} Scam Numbers — Reported Calls & Texts`,
    description: `Community-reported scam numbers on the ${telco} network in the Philippines. Check any ${telco} number for scam reports, free and without sign-up.`,
    alternates: { canonical: `/telco/${slug}` },
  };
}

export default async function TelcoPage({ params }: Props) {
  const { slug } = await params;
  const telco = TELCO_SLUGS[slug];
  if (!telco) notFound();

  const [numbers, prefixes] = await Promise.all([
    prisma.phoneNumber.findMany({
      where: { telco, reportCount: { gt: 0 }, status: "ACTIVE" },
      orderBy: [{ scamVotes: "desc" }, { lastActivityAt: "desc" }],
      take: 100,
    }),
    prisma.telcoPrefix.findMany({ where: { telco }, orderBy: { prefix: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-ink-faint">
        <Link href="/" className="hover:text-harbor">Home</Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink-soft">{telco}</span>
      </nav>

      <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">
        Reported {telco} numbers
      </h1>
      <p className="mt-2 max-w-2xl text-ink-soft">
        Scam calls and texts reported by the community from numbers on the{" "}
        {telco} network.
      </p>

      {numbers.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-line-strong bg-card px-4 py-8 text-center text-sm text-ink-soft">
          No reported {telco} numbers yet.{" "}
          <Link href="/report" className="font-semibold text-harbor underline">Report one</Link>.
        </p>
      ) : (
        <div className="mt-6">
          <NumberTable numbers={numbers} />
        </div>
      )}

      <section className="mt-10">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink-soft">
          {telco} prefixes
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {prefixes.map((p) => (
            <li key={p.prefix}>
              <Link
                href={`/prefix/${p.prefix}`}
                className="tel inline-block rounded-md border border-line bg-card px-3 py-1.5 text-sm font-semibold text-harbor hover:border-harbor"
              >
                {p.prefix}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
