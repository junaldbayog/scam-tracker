// Core + explicit metadata: the bundled entrypoints load their metadata via a
// JSON import attribute that some toolchains (tsx/esbuild) silently drop.
import { parsePhoneNumberFromString as parseCore } from "libphonenumber-js/core";
import metadata from "libphonenumber-js/min/metadata";

const parsePhoneNumberFromString = (text: string, country: "PH") =>
  parseCore(text, { defaultCountry: country }, metadata);

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
  // Grab number-ish runs: optional +, then 7+ digits possibly split by
  // spaces, dashes, dots, or parens.
  const candidates = text.match(/\+?\d[\d\s().-]{6,}\d/g) ?? [];
  const seen = new Set<string>();
  const out: ParsedNumber[] = [];
  for (const raw of candidates) {
    const parsed = parseNumber(raw);
    if (!parsed || seen.has(parsed.e164)) continue;
    seen.add(parsed.e164);
    out.push(parsed);
    if (out.length >= limit) break;
  }
  return out;
}
