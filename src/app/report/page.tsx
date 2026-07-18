import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { ReportForm } from "@/components/ReportForm";

export const metadata: Metadata = {
  title: "Report a scam number",
  description:
    "Report a scam call or text in the Philippines. No account needed — your report warns the next person who searches the number.",
  alternates: { canonical: "/report" },
};

export default async function ReportPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Report a number</h1>
      <p className="mt-2 text-ink-soft">
        Got a scam call or text? Report the number here — it takes a minute, needs
        no account, and warns everyone who searches that number after you.
      </p>
      <div className="mt-6 rounded-lg border border-line bg-card p-5 shadow-sm">
        <ReportForm categories={categories} />
      </div>
      <p className="mt-4 text-xs leading-relaxed text-ink-faint">
        By posting, you confirm the report describes your own experience and you
        agree to our content policy. Reports are community submissions, not
        verified facts.
      </p>
    </div>
  );
}
