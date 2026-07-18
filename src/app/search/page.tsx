import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { parseNumber } from "@/lib/phone";
import { SearchBox } from "@/components/SearchBox";

export const metadata: Metadata = {
  title: "Search a number",
  robots: { index: false, follow: true },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  if (query) {
    const parsed = parseNumber(query);
    if (parsed) redirect(`/number/${parsed.slug}`);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="font-display text-2xl font-bold text-ink">
        {query ? "We couldn't read that number" : "Check a phone number"}
      </h1>
      {query ? (
        <p className="mt-3 text-ink-soft">
          <span className="tel font-semibold text-ink">“{query}”</span> doesn't
          look like a valid phone number. Check for missing digits and try again.
        </p>
      ) : (
        <p className="mt-3 text-ink-soft">
          Type the number that called or texted you and we'll show you its reports.
        </p>
      )}
      <div className="mt-6">
        <SearchBox />
      </div>
      <div className="mt-8 rounded-lg border border-line bg-card p-4 text-sm text-ink-soft">
        <p className="font-semibold text-ink">Formats that work:</p>
        <ul className="mt-2 space-y-1">
          <li><span className="tel">0917 123 4567</span> — local mobile format</li>
          <li><span className="tel">+63 917 123 4567</span> — international format</li>
          <li><span className="tel">(02) 8123 4567</span> — Metro Manila landline</li>
        </ul>
      </div>
    </div>
  );
}
