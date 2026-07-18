import type { Score, Verdict } from "@/lib/scoring";

const VERDICT_STYLES: Record<Verdict, { text: string; bg: string; bar: string }> = {
  scam: { text: "text-scam", bg: "bg-scam-wash", bar: "bg-scam" },
  caution: { text: "text-caution", bg: "bg-caution-wash", bar: "bg-caution" },
  safe: { text: "text-safe", bg: "bg-safe-wash", bar: "bg-safe" },
  unverified: { text: "text-neutral-verdict", bg: "bg-neutral-wash", bar: "bg-ink-faint" },
};

/**
 * The signature element: an advisory-style verdict plate with a segmented
 * vote tally strip (scam share filled left-to-right, ballot-count style).
 */
export function VerdictPlate({
  nationalFormat,
  telco,
  score,
}: {
  nationalFormat: string;
  telco?: string | null;
  score: Score;
}) {
  const s = VERDICT_STYLES[score.verdict];
  const segments = 20;
  const filled =
    score.totalVotes === 0 ? 0 : Math.round((score.scamPct / 100) * segments);

  return (
    <section
      aria-label="Community verdict"
      className="overflow-hidden rounded-lg border border-line bg-card shadow-sm"
    >
      <div className={`flex items-center justify-between gap-3 border-b border-line px-4 py-2 ${s.bg}`}>
        <span className={`font-display text-xs font-bold uppercase tracking-widest ${s.text}`}>
          {score.label}
        </span>
        {telco ? (
          <span className="text-xs font-semibold text-ink-soft">{telco}</span>
        ) : null}
      </div>

      <div className="px-4 py-5 sm:px-6">
        <p className="tel text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {nationalFormat}
        </p>

        <div className="mt-5">
          <div
            className="flex gap-[3px]"
            role="img"
            aria-label={`${score.scamPct}% of ${score.totalVotes} votes say scam`}
          >
            {Array.from({ length: segments }, (_, i) => (
              <span
                key={i}
                className={`h-3 flex-1 rounded-[2px] ${
                  i < filled ? s.bar : "bg-neutral-wash"
                }`}
              />
            ))}
          </div>
          <div className="mt-2 flex items-baseline justify-between text-sm">
            {score.totalVotes > 0 ? (
              <>
                <span className={`font-semibold ${s.text}`}>
                  {score.scamPct}% say scam
                </span>
                <span className="text-ink-faint">
                  {score.totalVotes} vote{score.totalVotes === 1 ? "" : "s"}
                </span>
              </>
            ) : (
              <span className="text-ink-faint">
                No votes yet — be the first to vote below.
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
