import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdminPage } from "@/lib/admin-auth";
import { e164ToSlug } from "@/lib/telco";
import { moderateComment } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminQueuePage() {
  await requireAdminPage();

  const [queue, published] = await Promise.all([
    prisma.comment.findMany({
      where: { status: { in: ["PENDING", "FLAGGED"] } },
      orderBy: { createdAt: "asc" },
      take: 50,
      include: { phoneNumber: true, category: true },
    }),
    prisma.comment.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { phoneNumber: true, category: true },
    }),
  ]);

  return (
    <div>
      <p className="mb-4 rounded-md border border-line bg-harbor-wash px-4 py-2.5 text-sm text-ink-soft">
        Comments now publish immediately. Only comments containing links are held
        below for review; everything else is live and can be removed reactively.
      </p>

      {/* Only shown when a link-bearing comment is actually waiting. */}
      {queue.length > 0 ? (
        <>
          <h1 className="font-display text-xl font-bold text-ink">
            Held for review{" "}
            <span className="text-ink-faint">({queue.length})</span>
          </h1>

          <ul className="mt-4 space-y-3">
          {queue.map((c) => (
            <li key={c.id} className="rounded-lg border border-line bg-card p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Link
                  href={`/number/${e164ToSlug(c.phoneNumber.e164)}`}
                  className="tel font-semibold text-harbor hover:underline"
                >
                  {c.phoneNumber.nationalFormat}
                </Link>
                <span className="font-semibold text-ink">{c.displayName}</span>
                {c.category ? (
                  <span className="rounded-full bg-royal-wash px-2 py-0.5 font-semibold text-royal">
                    {c.category.name}
                  </span>
                ) : null}
                <span
                  className={`rounded-full px-2 py-0.5 font-semibold ${
                    c.status === "FLAGGED" ? "bg-caution-wash text-caution" : "bg-neutral-wash text-ink-soft"
                  }`}
                >
                  {c.status.toLowerCase()}
                </span>
                <time className="text-ink-faint">{c.createdAt.toLocaleString("en-PH")}</time>
                <span className="tel text-ink-faint">fp:{c.fingerprint.slice(0, 8)}</span>
              </div>
              <p className="mt-2 text-sm text-ink">{c.body}</p>
              <div className="mt-3 flex gap-2">
                <form action={moderateComment}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="action" value="approve" />
                  <button className="rounded-md bg-safe px-3 py-1.5 text-xs font-bold text-white hover:opacity-90">
                    Approve
                  </button>
                </form>
                <form action={moderateComment}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="action" value="reject" />
                  <button className="rounded-md bg-scam px-3 py-1.5 text-xs font-bold text-white hover:opacity-90">
                    Reject
                  </button>
                </form>
              </div>
            </li>
          ))}
          </ul>
        </>
      ) : null}

      <h2 className="mt-8 font-display text-xl font-bold text-ink">
        Recently published{" "}
        <span className="text-ink-faint">({published.length})</span>
      </h2>
      <p className="mt-1 text-sm text-ink-soft">
        Live comments. Remove any that are abusive, false, or violate the content policy.
      </p>

      {published.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-line-strong bg-card px-4 py-8 text-center text-sm text-ink-soft">
          No published comments yet.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {published.map((c) => (
            <li key={c.id} className="rounded-lg border border-line bg-card p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Link
                  href={`/number/${e164ToSlug(c.phoneNumber.e164)}`}
                  className="tel font-semibold text-harbor hover:underline"
                >
                  {c.phoneNumber.nationalFormat}
                </Link>
                <span className="font-semibold text-ink">{c.displayName}</span>
                {c.category ? (
                  <span className="rounded-full bg-royal-wash px-2 py-0.5 font-semibold text-royal">
                    {c.category.name}
                  </span>
                ) : null}
                <time className="text-ink-faint">{c.createdAt.toLocaleString("en-PH")}</time>
                <span className="tel text-ink-faint">fp:{c.fingerprint.slice(0, 8)}</span>
              </div>
              <p className="mt-2 text-sm text-ink">{c.body}</p>
              <div className="mt-3">
                <form action={moderateComment}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="action" value="reject" />
                  <button className="rounded-md border border-scam px-3 py-1.5 text-xs font-bold text-scam hover:bg-scam hover:text-white">
                    Remove
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
