import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE = "st_admin";
const SESSION_HOURS = 12;

function sign(payload: string): string {
  return createHmac("sha256", process.env.ADMIN_SESSION_SECRET ?? "")
    .update(payload)
    .digest("hex");
}

export function makeSessionToken(): string {
  const expires = Date.now() + SESSION_HOURS * 3600 * 1000;
  const payload = String(expires);
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = sign(payload);
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  } catch {
    return false;
  }
  return Number(payload) > Date.now();
}

export async function isAdmin(): Promise<boolean> {
  const c = await cookies();
  return verifySessionToken(c.get(COOKIE)?.value);
}

/** Call at the top of every admin page; redirects to login when unauthenticated. */
export async function requireAdminPage(): Promise<void> {
  if (!(await isAdmin())) {
    const { redirect } = await import("next/navigation");
    redirect("/admin/login");
  }
}

export async function setAdminCookie(): Promise<void> {
  const c = await cookies();
  c.set(COOKIE, makeSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: SESSION_HOURS * 3600,
    path: "/admin",
  });
}

export async function clearAdminCookie(): Promise<void> {
  const c = await cookies();
  c.set(COOKIE, "", { httpOnly: true, maxAge: 0, path: "/admin" });
}

export function checkPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  if (!expected) return false;
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
