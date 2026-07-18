import { prisma } from "@/lib/db";
import { TELCO_SLUGS, e164ToSlug } from "@/lib/telco";
import { GUIDES } from "@/lib/guides";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
export const NUMBERS_PER_SITEMAP = 10_000;

type Entry = { url: string; lastModified?: Date };

function toXml(entries: Entry[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (e) =>
      `  <url><loc>${e.url}</loc>${
        e.lastModified ? `<lastmod>${e.lastModified.toISOString()}</lastmod>` : ""
      }</url>`
  )
  .join("\n")}
</urlset>`;
}

/** Chunked sitemaps: /sitemaps/0.xml = static + browse pages; 1..N = numbers. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const id = Number(rawId.replace(/\.xml$/, ""));
  if (!Number.isInteger(id) || id < 0) {
    return new Response("Not found", { status: 404 });
  }

  let entries: Entry[];
  if (id === 0) {
    const [prefixes, categories] = await Promise.all([
      prisma.telcoPrefix.findMany({ orderBy: { prefix: "asc" } }),
      prisma.category.findMany({ select: { slug: true } }),
    ]);
    entries = [
      { url: `${SITE_URL}/` },
      { url: `${SITE_URL}/report` },
      { url: `${SITE_URL}/guides` },
      ...GUIDES.map((g) => ({ url: `${SITE_URL}/guides/${g.slug}` })),
      ...Object.keys(TELCO_SLUGS).map((slug) => ({ url: `${SITE_URL}/telco/${slug}` })),
      ...categories.map((c) => ({ url: `${SITE_URL}/category/${c.slug}` })),
      ...prefixes.map((p) => ({ url: `${SITE_URL}/prefix/${p.prefix}` })),
      ...["terms", "privacy", "content-policy", "disputes"].map((slug) => ({
        url: `${SITE_URL}/legal/${slug}`,
      })),
    ];
  } else {
    const numbers = await prisma.phoneNumber.findMany({
      where: { reportCount: { gt: 0 }, status: "ACTIVE" },
      orderBy: { firstReportedAt: "asc" },
      skip: (id - 1) * NUMBERS_PER_SITEMAP,
      take: NUMBERS_PER_SITEMAP,
      select: { e164: true, lastActivityAt: true },
    });
    entries = numbers.map((n) => ({
      url: `${SITE_URL}/number/${e164ToSlug(n.e164)}`,
      lastModified: n.lastActivityAt,
    }));
  }

  return new Response(toXml(entries), {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
