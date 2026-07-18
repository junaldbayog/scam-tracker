import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { telcoToSlug } from "@/lib/telco";
import { NumberTable } from "@/components/NumberTable";

export const revalidate = 3600;

type Props = { params: Promise<{ prefix: string }> };

async function loadPrefix(prefix: string) {
  if (!/^09\d\d$/.test(prefix)) return null;
  const telco = await prisma.telcoPrefix.findUnique({ where: { prefix } });
  return { prefix, telco: telco?.telco ?? null };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { prefix } = await params;
  const data = await loadPrefix(prefix);
  if (!data) return { title: "Prefix not found" };
  const count = await prisma.phoneNumber.count({
    where: { prefix, reportCount: { gt: 0 }, status: "ACTIVE" },
  });
  return {
    title: `${prefix} Numbers — Reported Scam Calls & Texts${data.telco ? ` (${data.telco})` : ""}`,
    description: `Scam reports for ${prefix} mobile numbers in the Philippines${data.telco ? ` — a ${data.telco} prefix` : ""}. ${count} reported number${count === 1 ? "" : "s"}. Check any ${prefix} number for free.`,
    alternates: { canonical: `/prefix/${prefix}` },
    robots: count > 0 ? undefined : { index: false, follow: true },
  };
}

export default async function PrefixPage({ params }: Props) {
  const { prefix } = await params;
  const data = await loadPrefix(prefix);
  if (!data) notFound();

  const numbers = await prisma.phoneNumber.findMany({
    where: { prefix, reportCount: { gt: 0 }, status: "ACTIVE" },
    orderBy: [{ scamVotes: "desc" }, { lastActivityAt: "desc" }],
    take: 100,
  });

  const siblings = await prisma.telcoPrefix.findMany({
    where: data.telco ? { telco: data.telco } : {},
    orderBy: { prefix: "asc" },
    take: 40,
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-ink-faint">
        <Link href="/" className="hover:text-harbor">Home</Link>
        <span className="mx-1.5">/</span>
        <span className="tel text-ink-soft">{prefix}</span>
      </nav>

      <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">
        <span className="tel">{prefix}</span> numbers
        {data.telco ? <span className="text-ink-soft"> · {data.telco}</span> : null}
      </h1>
      <p className="mt-2 max-w-2xl text-ink-soft">
        Community-reported scam calls and texts from mobile numbers starting
        with <span className="tel font-semibold text-ink">{prefix}</span>
        {data.telco ? (
          <>
            {" "}— a prefix assigned to{" "}
            <Link href={`/telco/${telcoToSlug(data.telco)}`} className="font-semibold text-harbor hover:underline">
              {data.telco}
            </Link>
          </>
        ) : null}
        . Reported {numbers.length === 0 ? "numbers" : `${numbers.length} number${numbers.length === 1 ? "" : "s"}`} shown by scam votes.
      </p>

      {numbers.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-line-strong bg-card px-4 py-8 text-center text-sm text-ink-soft">
          No reported numbers with this prefix yet.{" "}
          <Link href="/report" className="font-semibold text-harbor underline">Report one</Link>.
        </p>
      ) : (
        <div className="mt-6">
          <NumberTable numbers={numbers} />
        </div>
      )}

      {data.telco && siblings.length > 1 ? (
        <section className="mt-10">
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink-soft">
            Other {data.telco} prefixes
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {siblings
              .filter((s) => s.prefix !== prefix)
              .map((s) => (
                <li key={s.prefix}>
                  <Link
                    href={`/prefix/${s.prefix}`}
                    className="tel inline-block rounded-md border border-line bg-card px-3 py-1.5 text-sm font-semibold text-harbor hover:border-harbor"
                  >
                    {s.prefix}
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
