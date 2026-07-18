import { prisma } from "@/lib/db";
import { requireAdminPage } from "@/lib/admin-auth";
import { CurateTool } from "@/components/admin/CurateTool";

export const dynamic = "force-dynamic";

export default async function CuratePage() {
  await requireAdminPage();
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <h1 className="font-display text-xl font-bold text-ink">Review &amp; add numbers</h1>
      <p className="mt-1 text-sm text-ink-soft">
        A human-in-the-loop way to seed real numbers you&rsquo;ve vetted. Nothing
        is published until you decide, and the source text is never stored.
      </p>
      <div className="mt-5">
        <CurateTool categories={categories} />
      </div>
    </div>
  );
}
