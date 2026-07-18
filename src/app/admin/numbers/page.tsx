import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdminPage } from "@/lib/admin-auth";
import { e164ToSlug } from "@/lib/telco";
import { setNumberStatus } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminNumbersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdminPage();
  const { q } = await searchParams;

  // e164 is stored as +63…, so match on the national digits (drop leading 0s).
  const digits = q?.replace(/\D/g, "").replace(/^0+/, "") ?? "";
  const numbers = await prisma.phoneNumber.findMany({
    where: digits ? { e164: { contains: digits } } : {},
    orderBy: { lastActivityAt: "desc" },
    take: 50,
  });

  return (
    <div>
      <h1 className="font-display text-xl font-bold text-ink">Numbers</h1>
      <form className="mt-3 flex max-w-sm gap-2">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search digits…"
          className="tel w-full rounded-md border border-line-strong bg-card px-3 py-1.5 text-sm focus:border-harbor focus:outline-none"
        />
        <button className="rounded-md bg-harbor px-3 py-1.5 text-sm font-semibold text-white">
          Search
        </button>
      </form>

      <div className="mt-4 overflow-x-auto rounded-lg border border-line bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-faint">
              <th className="px-3 py-2 font-semibold">Number</th>
              <th className="px-3 py-2 font-semibold">Telco</th>
              <th className="px-3 py-2 text-right font-semibold">Scam</th>
              <th className="px-3 py-2 text-right font-semibold">Safe</th>
              <th className="px-3 py-2 text-right font-semibold">Reports</th>
              <th className="px-3 py-2 font-semibold">Status</th>
              <th className="px-3 py-2 font-semibold">Set status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {numbers.map((n) => (
              <tr key={n.id}>
                <td className="px-3 py-2">
                  <Link href={`/number/${e164ToSlug(n.e164)}`} className="tel font-semibold text-harbor hover:underline">
                    {n.nationalFormat}
                  </Link>
                </td>
                <td className="px-3 py-2 text-ink-soft">{n.telco ?? "—"}</td>
                <td className="tel px-3 py-2 text-right">{n.scamVotes}</td>
                <td className="tel px-3 py-2 text-right">{n.safeVotes}</td>
                <td className="tel px-3 py-2 text-right">{n.reportCount}</td>
                <td className="px-3 py-2 text-xs font-semibold uppercase text-ink-soft">{n.status}</td>
                <td className="px-3 py-2">
                  <form action={setNumberStatus} className="flex gap-1">
                    <input type="hidden" name="id" value={n.id} />
                    {(["ACTIVE", "DISPUTED", "DELISTED"] as const)
                      .filter((s) => s !== n.status)
                      .map((s) => (
                        <button
                          key={s}
                          name="status"
                          value={s}
                          className="rounded border border-line px-2 py-1 text-[10px] font-bold uppercase text-ink-soft hover:border-harbor hover:text-harbor"
                        >
                          {s.toLowerCase()}
                        </button>
                      ))}
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
