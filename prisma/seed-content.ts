/**
 * Seeds reported numbers from prisma/seed-numbers.json (public advisories).
 *   npx tsx prisma/seed-content.ts          — seed from JSON
 *   npx tsx prisma/seed-content.ts --demo   — add synthetic demo data (local dev only)
 *
 * Each JSON entry: { "number": "0917...", "source": "NTC advisory 2026-05",
 *   "category": "gcash-scam", "report": "text of the public warning" }
 */
import "dotenv/config";
import { readFileSync } from "fs";
import { join } from "path";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { parsePhoneNumberFromString as parseCore } from "libphonenumber-js/core";
import metadata from "libphonenumber-js/min/metadata";

const parsePhoneNumberFromString = (text: string, country: "PH") =>
  parseCore(text, { defaultCountry: country }, metadata);

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type SeedEntry = { number: string; source: string; category?: string; report: string };

const DEMO: SeedEntry[] = [
  {
    number: "0917 000 0001",
    source: "DEMO DATA — not a real report",
    category: "gcash-scam",
    report:
      "[Demo] Caller claimed to be GCash support and asked for the OTP to 'unlock' the account. Demo entry for local development.",
  },
  {
    number: "0918 000 0002",
    source: "DEMO DATA — not a real report",
    category: "fake-delivery",
    report:
      "[Demo] Text said an LBC package was on hold and asked for a P55 fee through a link. Demo entry for local development.",
  },
  {
    number: "0999 000 0003",
    source: "DEMO DATA — not a real report",
    category: "text-lottery",
    report:
      "[Demo] 'Congratulations! You won P150,000 from a raffle' with instructions to pay a release fee. Demo entry for local development.",
  },
];

async function seed(entries: SeedEntry[], demo: boolean) {
  const categories = await prisma.category.findMany();
  const bySlug = new Map(categories.map((c) => [c.slug, c.id]));
  let ok = 0;

  for (const entry of entries) {
    const parsed = parsePhoneNumberFromString(entry.number, "PH");
    if (!parsed || !parsed.isValid()) {
      console.warn(`Skipping unparseable number: ${entry.number}`);
      continue;
    }
    const nationalDigits = `0${parsed.nationalNumber}`;
    const prefix = nationalDigits.slice(0, 4);
    const telco = (await prisma.telcoPrefix.findUnique({ where: { prefix } }))?.telco;

    const number = await prisma.phoneNumber.upsert({
      where: { e164: parsed.number },
      update: { seedSource: entry.source },
      create: {
        e164: parsed.number,
        nationalFormat: parsed.formatNational(),
        prefix,
        telco,
        seedSource: entry.source,
      },
    });

    const already = await prisma.comment.findFirst({
      where: { phoneNumberId: number.id, fingerprint: "seed" },
    });
    if (already) continue;

    await prisma.$transaction(async (tx) => {
      await tx.comment.create({
        data: {
          phoneNumberId: number.id,
          body: `${entry.report}\n\nSource: ${entry.source}`,
          displayName: demo ? "Demo seed" : "TrackScam PH (from public advisory)",
          categoryId: entry.category ? (bySlug.get(entry.category) ?? null) : null,
          ipHash: "seed",
          fingerprint: "seed",
          status: "APPROVED",
        },
      });
      await tx.vote.upsert({
        where: { phoneNumberId_fingerprint: { phoneNumberId: number.id, fingerprint: "seed" } },
        update: {},
        create: { phoneNumberId: number.id, type: "SCAM", ipHash: "seed", fingerprint: "seed" },
      });
      await tx.phoneNumber.update({
        where: { id: number.id },
        data: {
          reportCount: { increment: 1 },
          scamVotes: { increment: 1 },
          lastActivityAt: new Date(),
        },
      });
    });
    ok++;
  }
  console.log(`Seeded ${ok} number(s).`);
}

async function main() {
  const demo = process.argv.includes("--demo");
  if (demo) {
    await seed(DEMO, true);
    return;
  }
  const file = JSON.parse(
    readFileSync(join(__dirname, "seed-numbers.json"), "utf8")
  ) as { numbers: SeedEntry[] };
  if (!file.numbers?.length) {
    console.log(
      "seed-numbers.json has no entries. Populate it from public advisories (see _readme), or run with --demo for local test data."
    );
    return;
  }
  await seed(file.numbers, false);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
