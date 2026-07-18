/**
 * Suggests a neutral, original-wording note + category for a detected number,
 * based on scam-type keywords near it in the pasted text. It classifies — it
 * never copies the source sentences — so the reviewer edits a clean suggestion
 * rather than typing from scratch, and the published text stays the site's own.
 */
type Rule = { slug: string; label: string; kws: string[] };

// First match wins; order from more specific to more generic.
const RULES: Rule[] = [
  { slug: "fake-delivery", label: "a possible fake delivery / parcel scam", kws: ["lbc", "j&t", "jnt", "j & t", "ninjavan", "ninja van", "flash express", "delivery", "parcel", "package", "courier", "shipping fee", "on hold"] },
  { slug: "gcash-scam", label: "a possible GCash / e-wallet scam", kws: ["gcash", "g-cash", "maya", "paymaya", "e-wallet", "ewallet", "mpin", "gcredit"] },
  { slug: "bank-phishing", label: "a possible bank phishing attempt", kws: ["bdo", "bpi", "metrobank", "unionbank", "landbank", "security bank", "pnb", "rcbc", "your account", "verify your", "card number", "otp"] },
  { slug: "loan-harassment", label: "possible loan-app harassment", kws: ["loan", "lending", "utang", "collector", "cashalo", "juanhand", "online lending"] },
  { slug: "job-scam", label: "a possible job / task scam", kws: ["job offer", "hiring", "recruit", "trabaho", "part-time", "part time", "task", "commission", "earn daily", "work from home"] },
  { slug: "text-lottery", label: "a possible raffle / prize scam", kws: ["raffle", "you won", "winner", "congratulations", "prize", "claim your", "promo winner", "napanalunan"] },
  { slug: "government-impersonation", label: "possible government impersonation", kws: ["sss", "philhealth", "pag-ibig", "nbi", "bir", "warrant", "court", "police", "immigration"] },
  { slug: "robocall", label: "a possible robocall / silent call", kws: ["robocall", "missed call", "one ring", "recorded message", "auto-dial", "wangiri"] },
  { slug: "sms-spam", label: "possible spam texts", kws: ["spam", "unsubscribe", "promo blast"] },
];

/**
 * Reduce pasted HTML (a full page source) to readable text before number
 * detection: drops script/style blocks and all tags, decodes common entities,
 * and collapses whitespace. This keeps HTML tags and attribute-only numbers
 * (widths, ids, timestamps) out of both the detected numbers and the prefill.
 */
export function stripHtml(input: string): string {
  if (!input.includes("<")) return input; // plain text — leave untouched
  return input
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}

export function suggestNote(context: string): { note: string; categorySlug: string | null } {
  const lc = context.toLowerCase();
  for (const r of RULES) {
    if (r.kws.some((k) => lc.includes(k))) {
      return { note: `Reported by the community as ${r.label}. Unverified.`, categorySlug: r.slug };
    }
  }
  return { note: "Reported by the community as a possible scam number. Unverified.", categorySlug: null };
}
