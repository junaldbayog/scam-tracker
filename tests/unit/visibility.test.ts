import { describe, expect, it } from "vitest";
import { INDEX_MIN_REPORTS, isIndexable } from "@/lib/visibility";

describe("isIndexable", () => {
  const base = { status: "ACTIVE", seedSource: null, reportCount: 0 };

  it("indexes a number as soon as it has at least one report", () => {
    expect(isIndexable({ ...base, reportCount: INDEX_MIN_REPORTS })).toBe(true);
    expect(isIndexable({ ...base, reportCount: INDEX_MIN_REPORTS + 5 })).toBe(true);
  });

  it("does NOT index an empty number (no reports, no source)", () => {
    expect(isIndexable({ ...base, reportCount: 0 })).toBe(false);
  });

  it("indexes an advisory / reviewed number immediately via seedSource", () => {
    expect(isIndexable({ ...base, seedSource: "NTC Advisory 2026-03-15", reportCount: 0 })).toBe(true);
    expect(isIndexable({ ...base, seedSource: "admin-curated", reportCount: 0 })).toBe(true);
  });

  it("never indexes non-ACTIVE numbers, even when corroborated", () => {
    expect(isIndexable({ status: "DELISTED", seedSource: "NTC", reportCount: 99 })).toBe(false);
    expect(isIndexable({ status: "DISPUTED", seedSource: null, reportCount: 99 })).toBe(false);
  });
});
