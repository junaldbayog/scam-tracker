/**
 * Suggests a neutral, original-wording note + category for a detected number,
 * based on scam-type keywords near it in the pasted text. It classifies — it
 * never copies the source sentences — so the reviewer edits a clean suggestion
 * rather than typing from scratch, and the published text stays the site's own.
 */
type Rule = { slug: string; label: string; kws: string[] };

// First match wins; order from more specific to more generic. Rules whose
// keywords could also appear in a broader bucket are placed above it, so the
// more specific scam type claims the match (e.g. sextortion before spam,
// online-shopping before the generic e-wallet rule when a seller is named).
const RULES: Rule[] = [
  { slug: "sextortion", label: "a possible sextortion / blackmail attempt", kws: ["sextortion", "nude", "nudes", "hubad", "naked", "intimate video", "private video", "video call scam", "vc scam", "blackmail", "extort", "i-post", "ipapakalat", "ikakalat", "ipapakita sa", "leak your", "kakalat na video", "recorded our", "screen record"] },
  { slug: "online-shopping-scam", label: "a possible online-shopping / non-delivery scam", kws: ["online seller", "fake seller", "scammer seller", "marketplace", "fb marketplace", "facebook marketplace", "shopee", "lazada", "tiktok shop", "carousell", "pre-order", "preorder", "cash on delivery", "non-delivery", "hindi dumating", "hindi nagpadala", "walang padala", "reservation fee", "downpayment", "sablay ang order", "budol"] },
  { slug: "investment-scam", label: "a possible investment / crypto scam", kws: ["invest", "investment", "crypto", "bitcoin", "usdt", "binance", "forex", "trading", "trader", "double your money", "doblehin", "padoble", "paluwagan", "pyramiding", "ponzi", "guaranteed profit", "guaranteed return", "roi", "mining", "kita agad", "passive income"] },
  { slug: "gambling-scam", label: "a possible online-gambling / betting scam", kws: ["online casino", "casino", "e-sabong", "esabong", "sabong", "online gambling", "betting", "sports betting", "sportsbook", "bookie", "sugal", "color game", "slot game", "jili", "pesobet", "deposit and withdraw", "bet now", "cash out ng panalo"] },
  { slug: "fake-delivery", label: "a possible fake delivery / parcel scam", kws: ["lbc", "j&t", "jnt", "j & t", "ninjavan", "ninja van", "flash express", "delivery", "parcel", "package", "courier", "shipping fee", "on hold"] },
  { slug: "gcash-scam", label: "a possible GCash / e-wallet scam", kws: ["gcash", "g-cash", "maya", "paymaya", "e-wallet", "ewallet", "mpin", "gcredit", "coins.ph", "grabpay", "shopeepay", "gotyme", "seabank", "tonik", "send money", "verification code"] },
  { slug: "bank-phishing", label: "a possible bank phishing attempt", kws: ["bdo", "bpi", "metrobank", "unionbank", "landbank", "security bank", "pnb", "rcbc", "your account", "verify your", "card number", "otp"] },
  { slug: "loan-harassment", label: "possible loan-app harassment", kws: ["loan", "lending", "utang", "collector", "cashalo", "juanhand", "online lending"] },
  { slug: "romance-scam", label: "a possible romance scam", kws: ["dating app", "tinder", "bumble", "online boyfriend", "online girlfriend", "online lover", "online relationship", "widower", "overseas boyfriend", "overseas girlfriend", "sundalo", "us army", "pakasalan", "fiance", "fiancee"] },
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
