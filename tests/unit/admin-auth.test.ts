import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  checkPassword,
  makeSessionToken,
  verifySessionToken,
} from "@/lib/admin-auth";

beforeEach(() => {
  process.env.ADMIN_SESSION_SECRET = "test-secret";
  process.env.ADMIN_PASSWORD = "correct-horse";
});

describe("session tokens", () => {
  it("round-trips a freshly minted token", () => {
    expect(verifySessionToken(makeSessionToken())).toBe(true);
  });

  it("rejects missing or malformed tokens", () => {
    expect(verifySessionToken(undefined)).toBe(false);
    expect(verifySessionToken("")).toBe(false);
    expect(verifySessionToken("no-dot-here")).toBe(false);
    expect(verifySessionToken("123.")).toBe(false);
  });

  it("rejects a tampered payload", () => {
    const token = makeSessionToken();
    const [payload, sig] = token.split(".");
    const farFuture = String(Number(payload) + 1_000_000_000);
    expect(verifySessionToken(`${farFuture}.${sig}`)).toBe(false);
  });

  it("rejects a token signed with a different secret", () => {
    const token = makeSessionToken();
    process.env.ADMIN_SESSION_SECRET = "rotated-secret";
    expect(verifySessionToken(token)).toBe(false);
  });

  it("rejects an expired token", () => {
    vi.useFakeTimers();
    const token = makeSessionToken();
    vi.advanceTimersByTime(13 * 3600 * 1000); // session lasts 12h
    expect(verifySessionToken(token)).toBe(false);
    vi.useRealTimers();
  });
});

describe("checkPassword", () => {
  it("accepts the configured password", () => {
    expect(checkPassword("correct-horse")).toBe(true);
  });

  it("rejects wrong, empty, and prefix passwords", () => {
    expect(checkPassword("wrong")).toBe(false);
    expect(checkPassword("")).toBe(false);
    expect(checkPassword("correct-hors")).toBe(false);
    expect(checkPassword("correct-horsee")).toBe(false);
  });

  it("rejects everything when no password is configured", () => {
    process.env.ADMIN_PASSWORD = "";
    expect(checkPassword("")).toBe(false);
    expect(checkPassword("anything")).toBe(false);
  });
});
