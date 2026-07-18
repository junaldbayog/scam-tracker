import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdminPage } from "@/lib/admin-auth";
import { e164ToSlug } from "@/lib/telco";
import { resolveDispute } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminDisputesPage() {
  await requireAdminPage();

  const disputes = await prisma.disputeRequest.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    take: 50,
    include: { phoneNumber: true },
  });

  return (
    <div>
      <h1 className="font-display text-xl font-bold text-ink">Dispute requests</h1>
      {disputes.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-line-strong bg-card px-4 py-8 text-center text-sm text-ink-soft">
          No dispute requests.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {disputes.map((d) => (
            <li key={d.id} className="rounded-lg border border-line bg-card p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Link
                  href={`/number/${e164ToSlug(d.phoneNumber.e164)}`}
                  className="tel font-semibold text-harbor hover:underline"
                >
                  {d.phoneNumber.nationalFormat}
                </Link>
                <span className="font-semibold text-ink">{d.claimantName}</span>
                <span className="text-ink-soft">{d.email}</span>
                <span
                  className={`rounded-full px-2 py-0.5 font-semibold ${
                    d.status === "OPEN"
                      ? "bg-caution-wash text-caution"
                      : d.status === "RESOLVED"
                        ? "bg-safe-wash text-safe"
                        : "bg-neutral-wash text-ink-soft"
                  }`}
                >
                  {d.status.toLowerCase()}
                </span>
                <time className="text-ink-faint">{d.createdAt.toLocaleString("en-PH")}</time>
              </div>
              <p className="mt-2 text-sm text-ink">{d.explanation}</p>
              {d.adminNote ? (
                <p className="mt-1 text-xs text-ink-faint">Note: {d.adminNote}</p>
              ) : null}
              {d.status === "OPEN" ? (
                <form action={resolveDispute} className="mt-3 flex flex-wrap items-center gap-2">
                  <input type="hidden" name="id" value={d.id} />
                  <input
                    name="note"
                    placeholder="Admin note (optional)"
                    className="rounded-md border border-line-strong bg-card px-2 py-1.5 text-xs focus:border-harbor focus:outline-none"
                  />
                  <button
                    name="action"
                    value="delist"
                    className="rounded-md bg-scam px-3 py-1.5 text-xs font-bold text-white hover:opacity-90"
                  >
                    Delist number
                  </button>
                  <button
                    name="action"
                    value="dismiss"
                    className="rounded-md bg-neutral-wash px-3 py-1.5 text-xs font-bold text-ink hover:bg-line"
                  >
                    Dismiss
                  </button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
