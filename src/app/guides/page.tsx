import type { Metadata } from "next";
import Link from "next/link";
import { GUIDES } from "@/lib/guides";

export const metadata: Metadata = {
  title: "Anti-Scam Guides for the Philippines",
  description:
    "Practical guides on Philippine phone scams — GCash schemes, fake delivery texts, loan app harassment — and how to report scam numbers to the NTC, PNP, and telcos.",
  alternates: { canonical: "/guides" },
};

export default function GuidesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">
        Anti-scam guides
      </h1>
      <p className="mt-2 text-ink-soft">
        How the common Philippine phone scams work, and exactly where to report
        them — written for the moment right after a suspicious call or text.
      </p>
      <ul className="mt-8 space-y-4">
        {GUIDES.map((g) => (
          <li key={g.slug} className="rounded-lg border border-line bg-card p-5 shadow-sm">
            <Link href={`/guides/${g.slug}`} className="group">
              <h2 className="font-display text-lg font-bold text-harbor group-hover:underline">
                {g.title}
              </h2>
              <p className="mt-1.5 text-sm text-ink-soft">{g.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
