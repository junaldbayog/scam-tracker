import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GUIDES, getGuide } from "@/lib/guides";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return { title: "Guide not found" };
  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical: `/guides/${slug}` },
  };
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: guide.title,
        description: guide.description,
        dateModified: guide.updated,
        author: { "@type": "Organization", name: "TrackScam PH" },
        mainEntityOfPage: `${SITE_URL}/guides/${guide.slug}`,
      },
      ...(guide.faq
        ? [
            {
              "@type": "FAQPage",
              mainEntity: guide.faq.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            },
          ]
        : []),
    ],
  };

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-ink-faint">
        <Link href="/" className="hover:text-harbor">Home</Link>
        <span className="mx-1.5">/</span>
        <Link href="/guides" className="hover:text-harbor">Guides</Link>
      </nav>

      <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink sm:text-4xl">
        {guide.title}
      </h1>
      <p className="mt-3 text-ink-soft">{guide.description}</p>
      <p className="mt-2 text-xs text-ink-faint">
        Updated{" "}
        {new Date(guide.updated).toLocaleDateString("en-PH", {
          year: "numeric",
          month: "long",
        })}
      </p>

      <div className="mt-8 space-y-8">
        {guide.sections.map((s) => (
          <section key={s.heading}>
            <h2 className="font-display text-xl font-bold text-ink">{s.heading}</h2>
            {s.body.map((p, i) => (
              <p key={i} className="mt-3 leading-relaxed text-ink-soft">{p}</p>
            ))}
          </section>
        ))}
      </div>

      {guide.faq && guide.faq.length > 0 ? (
        <section className="mt-10 rounded-lg border border-line bg-card p-5 shadow-sm">
          <h2 className="font-display text-lg font-bold text-ink">Common questions</h2>
          <dl className="mt-4 space-y-4">
            {guide.faq.map((f) => (
              <div key={f.q}>
                <dt className="font-semibold text-ink">{f.q}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-ink-soft">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      <div className="mt-10 rounded-lg border border-harbor bg-harbor-wash p-5">
        <p className="font-display font-bold text-harbor-deep">
          Got a number to check or report?
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link href="/" className="rounded-md bg-harbor px-4 py-2 text-sm font-semibold text-white hover:bg-harbor-deep">
            Check a number
          </Link>
          <Link href="/report" className="rounded-md border border-harbor px-4 py-2 text-sm font-semibold text-harbor hover:bg-card">
            Report a number
          </Link>
        </div>
      </div>
    </article>
  );
}
