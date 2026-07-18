import { createHash, randomUUID } from "crypto";
import { cookies, headers } from "next/headers";

const FP_COOKIE = "st_fp";

/** Hash the caller's IP with a server salt — raw IPs are never stored. */
export async function getIpHash(): Promise<string> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown";
  return createHash("sha256")
    .update(`${process.env.IP_HASH_SALT ?? ""}:${ip}`)
    .digest("hex")
    .slice(0, 32);
}

/** Read the browser fingerprint cookie; empty string when absent. */
export async function getFingerprint(): Promise<string> {
  const c = await cookies();
  return c.get(FP_COOKIE)?.value ?? "";
}

/** Ensure a fingerprint cookie exists (called from route handlers, where
 * cookie writes are allowed). Returns the value in effect. */
export async function ensureFingerprint(): Promise<string> {
  const c = await cookies();
  const existing = c.get(FP_COOKIE)?.value;
  if (existing) return existing;
  const value = randomUUID();
  c.set(FP_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365 * 2,
    path: "/",
  });
  return value;
}
