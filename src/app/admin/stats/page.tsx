import { prisma } from "@/lib/db";
import { requireAdminPage } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminStatsPage() {
  await requireAdminPage();

  const dayAgo = new Date(Date.now() - 24 * 3600 * 1000);
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);

  const [
    totalNumbers,
    reportedNumbers,
    totalComments,
    pendingComments,
    totalVotes,
    commentsToday,
    votesToday,
    commentsWeek,
    openDisputes,
  ] = await Promise.all([
    prisma.phoneNumber.count(),
    prisma.phoneNumber.count({ where: { reportCount: { gt: 0 } } }),
    prisma.comment.count({ where: { status: "APPROVED" } }),
    prisma.comment.count({ where: { status: { in: ["PENDING", "FLAGGED"] } } }),
    prisma.vote.count(),
    prisma.comment.count({ where: { createdAt: { gte: dayAgo } } }),
    prisma.vote.count({ where: { createdAt: { gte: dayAgo } } }),
    prisma.comment.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.disputeRequest.count({ where: { status: "OPEN" } }),
  ]);

  const tiles: [string, number][] = [
    ["Numbers tracked", totalNumbers],
    ["Numbers with reports", reportedNumbers],
    ["Approved reports", totalComments],
    ["Awaiting moderation", pendingComments],
    ["Total votes", totalVotes],
    ["Reports (24h)", commentsToday],
    ["Votes (24h)", votesToday],
    ["Reports (7d)", commentsWeek],
    ["Open disputes", openDisputes],
  ];

  return (
    <div>
      <h1 className="font-display text-xl font-bold text-ink">Stats</h1>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {tiles.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-line bg-card p-4 shadow-sm">
            <p className="tel text-2xl font-semibold text-ink">{value.toLocaleString()}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
