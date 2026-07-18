import Link from "next/link";
import { scoreNumber } from "@/lib/scoring";
import { e164ToSlug } from "@/lib/telco";

type Row = {
  id: string;
  e164: string;
  nationalFormat: string;
  telco: string | null;
  scamVotes: number;
  safeVotes: number;
  reportCount: number;
};

const VERDICT_TEXT: Record<string, string> = {
  scam: "text-scam",
  caution: "text-caution",
  safe: "text-safe",
  unverified: "text-ink-faint",
};

export function NumberTable({ numbers }: { numbers: Row[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-card shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-faint">
            <th className="px-4 py-2.5 font-semibold">Number</th>
            <th className="hidden px-4 py-2.5 font-semibold sm:table-cell">Network</th>
            <th className="px-4 py-2.5 text-right font-semibold">Reports</th>
            <th className="px-4 py-2.5 text-right font-semibold">Verdict</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {numbers.map((n) => {
            const s = scoreNumber({
              scamVotes: n.scamVotes,
              safeVotes: n.safeVotes,
              nationalFormat: n.nationalFormat,
              reportCount: n.reportCount,
            });
            return (
              <tr key={n.id} className="hover:bg-paper">
                <td className="px-4 py-2.5">
                  <Link
                    href={`/number/${e164ToSlug(n.e164)}`}
                    className="tel font-semibold text-harbor hover:underline"
                  >
                    {n.nationalFormat}
                  </Link>
                </td>
                <td className="hidden px-4 py-2.5 text-ink-soft sm:table-cell">
                  {n.telco ?? "—"}
                </td>
                <td className="tel px-4 py-2.5 text-right">{n.reportCount}</td>
                <td className="px-4 py-2.5 text-right">
                  <span className={`text-xs font-bold uppercase tracking-wide ${VERDICT_TEXT[s.verdict]}`}>
                    {s.verdict}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
