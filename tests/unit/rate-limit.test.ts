import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

// Unique key per test so state in the module-level store never collides.
let n = 0;
const key = () => `test:${Date.now()}:${n++}`;

describe("rateLimit", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("allows up to the limit and then blocks", () => {
    const k = key();
    for (let i = 0; i < 3; i++) {
      expect(rateLimit(k, 3, 60).ok).toBe(true);
    }
    expect(rateLimit(k, 3, 60).ok).toBe(false);
  });

  it("reports remaining budget", () => {
    const k = key();
    expect(rateLimit(k, 3, 60).remaining).toBe(2);
    expect(rateLimit(k, 3, 60).remaining).toBe(1);
    expect(rateLimit(k, 3, 60).remaining).toBe(0);
    expect(rateLimit(k, 3, 60).remaining).toBe(0); // blocked
  });

  it("frees budget after the window slides past old hits", () => {
    const k = key();
    for (let i = 0; i < 3; i++) rateLimit(k, 3, 60);
    expect(rateLimit(k, 3, 60).ok).toBe(false);

    vi.advanceTimersByTime(61_000);
    expect(rateLimit(k, 3, 60).ok).toBe(true);
  });

  it("keeps keys independent", () => {
    const a = key();
    const b = key();
    for (let i = 0; i < 3; i++) rateLimit(a, 3, 60);
    expect(rateLimit(a, 3, 60).ok).toBe(false);
    expect(rateLimit(b, 3, 60).ok).toBe(true);
  });
});
