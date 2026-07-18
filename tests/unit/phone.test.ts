import { describe, expect, it } from "vitest";
import { parseNumber, slugToQuery } from "@/lib/phone";
import { e164ToSlug } from "@/lib/telco";

describe("parseNumber", () => {
  it("parses bare national mobile format", () => {
    const p = parseNumber("09171234567");
    expect(p).not.toBeNull();
    expect(p!.e164).toBe("+639171234567");
    expect(p!.slug).toBe("09171234567");
    expect(p!.prefix).toBe("0917");
    expect(p!.countryCode).toBe("PH");
  });

  it.each([
    "0917 123 4567",
    "0917-123-4567",
    "+63 917 123 4567",
    "+639171234567",
    "  0917 123 4567  ",
    "(0917) 123-4567",
  ])("normalizes %s to the same canonical slug", (input) => {
    expect(parseNumber(input)?.slug).toBe("09171234567");
  });

  it("parses Metro Manila landlines", () => {
    const p = parseNumber("(02) 8123 4567");
    expect(p?.e164).toBe("+63281234567");
    expect(p?.slug).toBe("0281234567");
  });

  it("parses foreign numbers in international format (global-ready)", () => {
    const p = parseNumber("+12025550123");
    expect(p?.e164).toBe("+12025550123");
    expect(p?.slug).toBe("12025550123"); // non-PH slug = E.164 digits, no plus
  });

  it.each(["", "   ", "garbage", "0917123", "12345", "++63917", "09171234567890123"])(
    "rejects invalid input %j",
    (input) => {
      expect(parseNumber(input)).toBeNull();
    }
  );

  it("round-trips slug → query → same number", () => {
    const original = parseNumber("0917 123 4567")!;
    const reparsed = parseNumber(slugToQuery(original.slug));
    expect(reparsed?.e164).toBe(original.e164);
  });
});

describe("slugToQuery", () => {
  it("keeps PH national slugs as-is", () => {
    expect(slugToQuery("09171234567")).toBe("09171234567");
  });
  it("treats non-zero-leading slugs as international", () => {
    expect(slugToQuery("12025550123")).toBe("+12025550123");
  });
  it("strips non-digits", () => {
    expect(slugToQuery("0917-123-4567")).toBe("09171234567");
  });
  it("returns empty string for digit-less input", () => {
    expect(slugToQuery("abc")).toBe("");
  });
});

describe("e164ToSlug", () => {
  it("converts PH E.164 to national slug", () => {
    expect(e164ToSlug("+639171234567")).toBe("09171234567");
  });
  it("converts foreign E.164 to plain digits", () => {
    expect(e164ToSlug("+12025550123")).toBe("12025550123");
  });
});
