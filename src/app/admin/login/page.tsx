import type { Metadata } from "next";
import { login } from "../actions";

export const metadata: Metadata = {
  title: "Admin login",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="mx-auto max-w-sm px-4 py-20">
      <h1 className="font-display text-xl font-bold text-ink">Admin</h1>
      <form action={login} className="mt-4 space-y-3">
        <div>
          <label htmlFor="pw" className="block text-sm font-semibold text-ink">
            Password
          </label>
          <input
            id="pw"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="mt-1 w-full rounded-md border border-line-strong bg-card px-3 py-2 focus:border-harbor focus:outline-none"
          />
        </div>
        {error === "1" ? (
          <p className="text-sm text-scam" role="alert">Wrong password.</p>
        ) : null}
        {error === "rate" ? (
          <p className="text-sm text-scam" role="alert">Too many attempts. Wait 15 minutes.</p>
        ) : null}
        <button className="w-full rounded-md bg-harbor px-4 py-2 font-semibold text-white hover:bg-harbor-deep">
          Sign in
        </button>
      </form>
    </div>
  );
}
