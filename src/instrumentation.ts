/**
 * Next.js runs register() once at server startup. We validate required secrets
 * here so a misconfigured production deploy fails fast instead of serving with
 * forgeable admin sessions or disabled bot checks. Node runtime only.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { assertEnv } = await import("@/lib/env");
    assertEnv();
  }
}
