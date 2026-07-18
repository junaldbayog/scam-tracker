import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { e164ToSlug } from "@/lib/telco";
import { NumberTable } from "@/components/NumberTable";

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const categories = await prisma.category.findMany({ select: { slug: true } });
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) return { title: "Category not found" };
  return {
    title: `${category.name} Numbers — Reported in the Philippines`,
    description: `Phone numbers reported for ${category.name.toLowerCase()} in the Philippines. ${category.blurb ?? ""} Check and report numbers for free.`,
    alternates: { canonical: `/category/${slug}` },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) notFound();

  const numbers = await prisma.phoneNumber.findMany({
    where: {
      status: "ACTIVE",
      reportCount: { gt: 0 },
      comments: { some: { categoryId: category.id, status: "APPROVED" } },
    },
    orderBy: [{ scamVotes: "desc" }, { lastActivityAt: "desc" }],
    take: 100,
  });

  const recent = await prisma.comment.findMany({
    where: { categoryId: category.id, status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { phoneNumber: true },
  });

  const allCategories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-ink-faint">
        <Link href="/" className="hover:text-harbor">Home</Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink-soft">{category.name}</span>
      </nav>

      <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">
        {category.name} numbers
        {category.nameFil && category.nameFil !== category.name ? (
          <span className="ml-2 text-lg font-semibold text-ink-faint">({category.nameFil})</span>
        ) : null}
      </h1>
      {category.blurb ? (
        <p className="mt-2 max-w-2xl text-ink-soft">{category.blurb}</p>
      ) : null}

      {numbers.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-line-strong bg-card px-4 py-8 text-center text-sm text-ink-soft">
          No numbers reported for this scam type yet.{" "}
          <Link href="/report" className="font-semibold text-harbor underline">Report one</Link>.
        </p>
      ) : (
        <div className="mt-6">
          <NumberTable numbers={numbers} />
        </div>
      )}

      {recent.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-display text-lg font-bold text-ink">Recent {category.name.toLowerCase()} reports</h2>
          <ul className="mt-3 space-y-3">
            {recent.map((c) => (
              <li key={c.id} className="rounded-lg border border-line bg-card p-4 shadow-sm">
                <Link
                  href={`/number/${e164ToSlug(c.phoneNumber.e164)}`}
                  className="tel text-sm font-semibold text-harbor hover:underline"
                >
                  {c.phoneNumber.nationalFormat}
                </Link>
                <p className="mt-1.5 line-clamp-2 text-sm text-ink-soft">{c.body}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink-soft">
          Other scam types
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {allCategories
            .filter((c) => c.slug !== slug)
            .map((c) => (
              <li key={c.id}>
                <Link
                  href={`/category/${c.slug}`}
                  className="inline-block rounded-md border border-line bg-card px-3 py-1.5 text-sm font-semibold text-harbor hover:border-harbor"
                >
                  {c.name}
                </Link>
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}
