import { prisma } from "@/lib/db";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const NUMBERS_PER_SITEMAP = 10_000;

// Re-generate hourly so new chunks appear as the number count grows.
export const revalidate = 3600;

/** Sitemap index pointing at the chunked sitemaps served at /sitemaps/[id].xml. */
export async function GET() {
  const count = await prisma.phoneNumber.count({
    where: { reportCount: { gt: 0 }, status: "ACTIVE" },
  });
  const chunks = Math.max(1, Math.ceil(count / NUMBERS_PER_SITEMAP));
  const ids = [0, ...Array.from({ length: chunks }, (_, i) => i + 1)];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${ids.map((id) => `  <sitemap><loc>${SITE_URL}/sitemaps/${id}.xml</loc></sitemap>`).join("\n")}
</sitemapindex>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
