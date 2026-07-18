import { describe, expect, it } from "vitest";
import { scoreNumber } from "@/lib/scoring";

const base = { nationalFormat: "0917 123 4567", reportCount: 1 };

describe("scoreNumber verdicts", () => {
  it("is unverified below 3 total votes even at 100% scam", () => {
    const s = scoreNumber({ ...base, scamVotes: 2, safeVotes: 0 });
    expect(s.verdict).toBe("unverified");
    expect(s.scamPct).toBe(100);
    expect(s.totalVotes).toBe(2);
  });

  it("is scam at >=70% with enough votes", () => {
    expect(scoreNumber({ ...base, scamVotes: 7, safeVotes: 3 }).verdict).toBe("scam");
    expect(scoreNumber({ ...base, scamVotes: 3, safeVotes: 0 }).verdict).toBe("scam");
  });

  it("is caution between 40% and 69%", () => {
    expect(scoreNumber({ ...base, scamVotes: 2, safeVotes: 2 }).verdict).toBe("caution");
    expect(scoreNumber({ ...base, scamVotes: 69, safeVotes: 31 }).verdict).toBe("caution");
  });

  it("is safe below 40%", () => {
    expect(scoreNumber({ ...base, scamVotes: 1, safeVotes: 9 }).verdict).toBe("safe");
    expect(scoreNumber({ ...base, scamVotes: 0, safeVotes: 3 }).verdict).toBe("safe");
  });

  it("handles zero votes without dividing by zero", () => {
    const s = scoreNumber({ ...base, scamVotes: 0, safeVotes: 0, reportCount: 0 });
    expect(s.verdict).toBe("unverified");
    expect(s.scamPct).toBe(0);
    expect(s.summary).toContain("no community votes yet");
  });

  it("boundary: exactly 70% is scam, exactly 40% is caution", () => {
    expect(scoreNumber({ ...base, scamVotes: 7, safeVotes: 3 }).scamPct).toBe(70);
    expect(scoreNumber({ ...base, scamVotes: 7, safeVotes: 3 }).verdict).toBe("scam");
    expect(scoreNumber({ ...base, scamVotes: 4, safeVotes: 6 }).verdict).toBe("caution");
  });
});

describe("scoreNumber summary", () => {
  it("includes telco, report count, and top category", () => {
    const s = scoreNumber({
      ...base,
      scamVotes: 9,
      safeVotes: 1,
      telco: "Globe/TM",
      reportCount: 12,
      topCategory: "GCash / e-wallet scam",
    });
    expect(s.summary).toContain("Globe/TM");
    expect(s.summary).toContain("12 reports");
    expect(s.summary).toContain("90% of 10 votes");
    expect(s.summary).toContain("GCash / e-wallet scam");
  });

  it("uses singular forms for one report and one vote", () => {
    const s = scoreNumber({ ...base, scamVotes: 1, safeVotes: 0, reportCount: 1 });
    expect(s.summary).toContain("1 report.");
    expect(s.summary).toContain("1 vote");
    expect(s.summary).not.toContain("1 reports");
  });
});
