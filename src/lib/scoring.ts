export type Verdict = "scam" | "caution" | "safe" | "unverified";

export type Score = {
  verdict: Verdict;
  scamPct: number; // 0-100, rounded
  totalVotes: number;
  label: string;
  summary: string;
};

const MIN_VOTES_FOR_VERDICT = 3;

export function scoreNumber(opts: {
  scamVotes: number;
  safeVotes: number;
  nationalFormat: string;
  telco?: string | null;
  reportCount: number;
  topCategory?: string | null;
}): Score {
  const { scamVotes, safeVotes } = opts;
  const totalVotes = scamVotes + safeVotes;
  const scamPct = totalVotes === 0 ? 0 : Math.round((scamVotes / totalVotes) * 100);

  let verdict: Verdict;
  if (totalVotes < MIN_VOTES_FOR_VERDICT) verdict = "unverified";
  else if (scamPct >= 70) verdict = "scam";
  else if (scamPct >= 40) verdict = "caution";
  else verdict = "safe";

  const label = {
    scam: "Reported as scam",
    caution: "Mixed reports — be careful",
    safe: "Reported as safe",
    unverified: "Not enough reports yet",
  }[verdict];

  const telcoPart = opts.telco ? `${opts.telco} number` : "number";
  const catPart = opts.topCategory ? `, mostly tagged “${opts.topCategory}”` : "";
  const summary =
    totalVotes === 0
      ? `${opts.nationalFormat} is a ${telcoPart} with no community votes yet.`
      : `${opts.nationalFormat} is a ${telcoPart} with ${opts.reportCount} report${opts.reportCount === 1 ? "" : "s"}. ${scamPct}% of ${totalVotes} vote${totalVotes === 1 ? "" : "s"} flag it as a scam${catPart}.`;

  return { verdict, scamPct, totalVotes, label, summary };
}
