import { describe, expect, it } from "vitest";
import { checkEnv } from "@/lib/env";

const goodProd = {
  NODE_ENV: "production",
  DATABASE_URL: "postgresql://u:p@host:5432/db",
  ADMIN_PASSWORD: "a-strong-password-123",
  ADMIN_SESSION_SECRET: "0123456789abcdef0123456789abcdef", // 32 chars
  IP_HASH_SALT: "sixteen-char-salt!",
  TURNSTILE_SECRET_KEY: "secret",
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: "sitekey",
  NEXT_PUBLIC_SITE_URL: "https://trackscam.ph",
  DISPUTE_WEBHOOK_URL: "https://hooks.example/x",
} as NodeJS.ProcessEnv;

describe("checkEnv", () => {
  it("passes with a complete production config", () => {
    expect(checkEnv(goodProd)).toEqual({ errors: [], warnings: [] });
  });

  it("flags missing required secrets", () => {
    const { errors } = checkEnv({ NODE_ENV: "production" } as NodeJS.ProcessEnv);
    expect(errors.some((e) => e.includes("ADMIN_SESSION_SECRET"))).toBe(true);
    expect(errors.some((e) => e.includes("TURNSTILE_SECRET_KEY"))).toBe(true);
    expect(errors.some((e) => e.includes("DATABASE_URL"))).toBe(true);
  });

  it("flags a too-short session secret (forgeable-session guard)", () => {
    const { errors } = checkEnv({ ...goodProd, ADMIN_SESSION_SECRET: "short" });
    expect(errors.some((e) => e.includes("ADMIN_SESSION_SECRET") && e.includes("too short"))).toBe(true);
  });

  it("warns (not errors) when only the recommended webhook is missing", () => {
    const { errors, warnings } = checkEnv({ ...goodProd, DISPUTE_WEBHOOK_URL: "" });
    expect(errors).toEqual([]);
    expect(warnings.some((w) => w.includes("DISPUTE_WEBHOOK_URL"))).toBe(true);
  });
});
