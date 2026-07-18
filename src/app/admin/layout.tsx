import Link from "next/link";
import { isAdmin } from "@/lib/admin-auth";
import { logout } from "./actions";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Access control lives in each page via requireAdminPage(); the layout
  // only decides whether to show the nav.
  const authed = await isAdmin();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {authed ? (
        <div className="mb-6 flex flex-wrap items-center gap-4 border-b border-line pb-3 text-sm">
          <span className="font-display font-bold text-ink">Admin</span>
          <Link href="/admin" className="text-harbor hover:underline">Moderation queue</Link>
          <Link href="/admin/curate" className="text-harbor hover:underline">Add numbers</Link>
          <Link href="/admin/disputes" className="text-harbor hover:underline">Disputes</Link>
          <Link href="/admin/numbers" className="text-harbor hover:underline">Numbers</Link>
          <Link href="/admin/stats" className="text-harbor hover:underline">Stats</Link>
          <form action={logout} className="ml-auto">
            <button className="text-ink-faint hover:text-ink">Sign out</button>
          </form>
        </div>
      ) : null}
      {children}
    </div>
  );
}
