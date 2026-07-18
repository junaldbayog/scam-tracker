// Core + explicit metadata: the bundled entrypoints load their metadata via a
// JSON import attribute that some toolchains (tsx/esbuild) silently drop.
import {
  parsePhoneNumberFromString as parseCore,
  findPhoneNumbersInText as findCore,
} from "libphonenumber-js/core";
import metadata from "libphonenumber-js/min/metadata";

const parsePhoneNumberFromString = (text: string, country: "PH") =>
  parseCore(text, { defaultCountry: country }, metadata);

// Robust scan for phone numbers in free/messy text — handles page source,
// adjacent timestamps/ids, and varied formatting without gluing tokens.
const findNumbersInText = (text: string) =>
  findCore(text, { defaultCountry: "PH" }, metadata);

export type ParsedNumber = {
  e164: string; // +639171234567
  nationalFormat: string; // 0917 123 4567
  slug: string; // 09171234567 — used in URLs
  prefix: string; // 0917
  countryCode: string; // PH
};

/**
 * Parse any user-entered phone number. PH is the default region, so bare
 * national formats (0917..., 917...) resolve to +63; full international
 * numbers from other countries still parse, keeping the schema global-ready.
 */
export function parseNumber(raw: string): ParsedNumber | null {
  const cleaned = raw.trim();
  if (!cleaned) return null;
  const parsed = parsePhoneNumberFromString(cleaned, "PH");
  if (!parsed || !parsed.isValid()) return null;

  const e164 = parsed.number;
  const national = parsed.formatNational(); // e.g. "0917 123 4567"
  const slug = nationalSlug(parsed.countryCallingCode, parsed.nationalNumber, e164);

  return {
    e164,
    nationalFormat: national,
    slug,
    prefix: slug.slice(0, 4),
    countryCode: parsed.country ?? "ZZ",
  };
}

/** URL slug: PH numbers use national digits (09171234567) to match how
 * Filipinos search; non-PH numbers fall back to E.164 digits with no plus. */
function nationalSlug(callingCode: string, nationalNumber: string, e164: string): string {
  if (callingCode === "63") return `0${nationalNumber}`;
  return e164.replace("+", "");
}

/** Resolve a URL slug back to a parseable string. */
export function slugToQuery(slug: string): string {
  const digits = slug.replace(/\D/g, "");
  if (!digits) return "";
  // PH national format (0917...) parses as-is with PH default region;
  // anything else is treated as international digits.
  if (digits.startsWith("0")) return digits;
  return `+${digits}`;
}

/** Group digits for display: 0917 123 4567 style for 11-digit PH numbers. */
export function displayFormat(nationalFormat: string): string {
  return nationalFormat;
}

/**
 * Scan free text and return the unique, valid phone numbers found in it.
 * Used by the admin curation tool: the human pastes text they've chosen to
 * read, and we extract only the numbers — never the surrounding content.
 */
export function extractCandidateNumbers(text: string, limit = 60): ParsedNumber[] {
  const seen = new Set<string>();
  const out: ParsedNumber[] = [];
  for (const found of findNumbersInText(text)) {
    const parsed = parseNumber(found.number.number);
    if (!parsed || seen.has(parsed.e164)) continue;
    seen.add(parsed.e164);
    out.push(parsed);
    if (out.length >= limit) break;
  }
  return out;
}

/**
 * Like extractCandidateNumbers, but also returns a slice of the text around each
 * number so the caller can classify what kind of scam it was mentioned with.
 * The context is used only to suggest a note — it is never published verbatim.
 */
export function extractCandidateNumbersWithContext(
  text: string,
  windowChars = 140,
  limit = 60
): { parsed: ParsedNumber; context: string }[] {
  const seen = new Set<string>();
  const hits: { parsed: ParsedNumber; start: number; end: number }[] = [];
  for (const found of findNumbersInText(text)) {
    const parsed = parseNumber(found.number.number);
    if (!parsed || seen.has(parsed.e164)) continue;
    seen.add(parsed.e164);
    hits.push({ parsed, start: found.startsAt, end: found.endsAt });
    if (hits.length >= limit) break;
  }

  // Classify each number only from the text that FOLLOWS it, up to the next
  // number. Scam reports read "NUMBER did X", so the description trails the
  // number; this stops one number's keywords from bleeding into a neighbor.
  // A missed keyword just yields the neutral generic note (a safe fallback),
  // never a confident wrong label.
  return hits.map((h, i) => {
    const nextStart = i < hits.length - 1 ? hits[i + 1].start : text.length;
    const right = Math.min(text.length, nextStart, h.end + windowChars);
    return { parsed: h.parsed, context: text.slice(h.start, right) };
  });
}
