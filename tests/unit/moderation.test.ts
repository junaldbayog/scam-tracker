import { describe, expect, it } from "vitest";
import { checkComment, checkDisplayName } from "@/lib/moderation";

const VALID = "Called pretending to be BDO and asked for my OTP over the phone.";

describe("checkComment", () => {
  it("publishes a clean comment immediately", () => {
    const r = checkComment(VALID);
    expect(r.action).toBe("approve");
    expect(r.reasons).toEqual([]);
  });

  it("publishes first posts immediately (no pre-publish hold)", () => {
    // There is no longer an 'established poster' distinction — everyone posts now.
    expect(checkComment(VALID).action).toBe("approve");
  });

  it("rejects comments that are too short", () => {
    expect(checkComment("scam").action).toBe("reject");
    expect(checkComment("scam").reasons).toContain("too_short");
  });

  it("rejects comments over 2000 characters", () => {
    const r = checkComment("a".repeat(2001));
    expect(r.action).toBe("reject");
    expect(r.reasons).toContain("too_long");
  });

  it("holds comments containing links (anti-phishing)", () => {
    const r = checkComment(`${VALID} See https://phish.example.com for proof.`);
    expect(r.action).toBe("pending");
    expect(r.reasons).toContain("contains_link");
  });

  it("publishes comments with long digit runs (they post now)", () => {
    const r = checkComment(`${VALID} They asked me to send money to 123456789012345.`);
    expect(r.action).toBe("approve");
  });

  it("publishes profane comments (no profanity hold anymore)", () => {
    const r = checkComment(`${VALID} Tangina nila talaga.`);
    expect(r.action).toBe("approve");
  });

  it("strips email addresses but still publishes", () => {
    const r = checkComment(`${VALID} My email is juan@example.com if you need info.`);
    expect(r.cleaned).not.toContain("juan@example.com");
    expect(r.cleaned).toContain("[removed]");
    expect(r.reasons).toContain("email_removed");
    expect(r.action).toBe("approve");
  });

  it("collapses whitespace", () => {
    const r = checkComment("Called   me\n\nabout   a fake   package fee today.");
    expect(r.cleaned).toBe("Called me about a fake package fee today.");
  });
});

describe("checkDisplayName", () => {
  it("defaults empty input to Anonymous", () => {
    expect(checkDisplayName("")).toBe("Anonymous");
    expect(checkDisplayName("   ")).toBe("Anonymous");
  });

  it("strips angle brackets", () => {
    expect(checkDisplayName("<b>Juan</b>")).toBe("bJuan/b");
  });

  it("truncates to 40 characters", () => {
    expect(checkDisplayName("x".repeat(80)).length).toBeLessThanOrEqual(40);
  });
});
