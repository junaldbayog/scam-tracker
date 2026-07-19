/**
 * Startup configuration guard.
 *
 * Several secrets fail *silently* when unset: an empty ADMIN_SESSION_SECRET
 * makes admin sessions forgeable, an unset TURNSTILE_SECRET_KEY turns the bot
 * checks into no-ops, and a missing IP_HASH_SALT weakens IP hashing. In
 * production we refuse to boot when any required value is missing or too weak
 * (fail closed). In development we only warn, so local work isn't blocked.
 *
 * Note: NEXT_PUBLIC_TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY are required
 * together — a secret without a site key means the widget never renders, so
 * every real submission would fail verification.
 */
type Rule = { key: string; minLen?: number };

const REQUIRED_IN_PROD: Rule[] = [
  { key: "DATABASE_URL" },
  { key: "ADMIN_PASSWORD", minLen: 12 },
  { key: "ADMIN_SESSION_SECRET", minLen: 32 },
  { key: "IP_HASH_SALT", minLen: 16 },
  { key: "TURNSTILE_SECRET_KEY" },
  { key: "NEXT_PUBLIC_TURNSTILE_SITE_KEY" },
  { key: "NEXT_PUBLIC_SITE_URL" },
];

const RECOMMENDED: string[] = ["DISPUTE_WEBHOOK_URL"];

/** Pure check — returns problems without side effects (unit-testable). */
export function checkEnv(env: NodeJS.ProcessEnv = process.env): {
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const { key, minLen } of REQUIRED_IN_PROD) {
    const value = env[key]?.trim() ?? "";
    if (!value) errors.push(`${key} is required but not set`);
    else if (minLen && value.length < minLen) {
      errors.push(`${key} is too short (needs at least ${minLen} characters)`);
    }
  }
  for (const key of RECOMMENDED) {
    if (!env[key]?.trim()) {
      warnings.push(`${key} is not set — recommended (e.g. dispute alerts are log-only without it)`);
    }
  }
  return { errors, warnings };
}

/** Enforce at boot: throw in production, warn in dev. */
export function assertEnv(env: NodeJS.ProcessEnv = process.env): void {
  const { errors, warnings } = checkEnv(env);
  for (const w of warnings) console.warn(`[env] ${w}`);
  if (errors.length === 0) return;

  const message =
    "Startup configuration check failed:\n" + errors.map((e) => `  - ${e}`).join("\n");

  if (env.NODE_ENV === "production") {
    throw new Error(message); // fail closed — do not serve with weak secrets
  }
  console.warn(`[env] ${message}\n[env] (development mode: continuing anyway)`);
}
