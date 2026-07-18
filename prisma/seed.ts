import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// PH mobile prefixes → network. Compiled from publicly listed telco prefix
// tables; kept approximate on purpose — used for display context only.
const TELCO_PREFIXES: Record<string, string[]> = {
  "Globe/TM": [
    "0904", "0905", "0906", "0915", "0916", "0917", "0926", "0927",
    "0935", "0936", "0937", "0945", "0953", "0954", "0955", "0956",
    "0957", "0958", "0959", "0965", "0966", "0967", "0975", "0976",
    "0977", "0978", "0979", "0995", "0996", "0997",
  ],
  "Smart/TNT": [
    "0907", "0908", "0909", "0910", "0911", "0912", "0913", "0914",
    "0918", "0919", "0920", "0921", "0928", "0929", "0930", "0938",
    "0939", "0946", "0947", "0948", "0949", "0950", "0951", "0961",
    "0963", "0964", "0968", "0969", "0970", "0981", "0989", "0992",
    "0998", "0999",
  ],
  "DITO": ["0895", "0896", "0897", "0898", "0991", "0993", "0994"],
  "Sun": [
    "0922", "0923", "0924", "0925", "0931", "0932", "0933", "0934",
    "0940", "0941", "0942", "0943", "0944", "0973", "0974",
  ],
};

const CATEGORIES: { slug: string; name: string; nameFil: string; blurb: string }[] = [
  {
    slug: "gcash-scam",
    name: "GCash / e-wallet scam",
    nameFil: "GCash scam",
    blurb: "Fake GCash support, phishing links, bogus send-money requests, and account takeover attempts.",
  },
  {
    slug: "fake-delivery",
    name: "Fake delivery notice",
    nameFil: "Pekeng delivery",
    blurb: "Texts pretending to be LBC, J&T, or other couriers asking you to pay fees or click tracking links.",
  },
  {
    slug: "bank-phishing",
    name: "Bank phishing",
    nameFil: "Bank phishing",
    blurb: "Messages impersonating BDO, BPI, Metrobank, UnionBank and others to steal login credentials or OTPs.",
  },
  {
    slug: "sms-spam",
    name: "SMS spam",
    nameFil: "Spam na text",
    blurb: "Unsolicited marketing or junk texts, often with suspicious links.",
  },
  {
    slug: "loan-harassment",
    name: "Loan app harassment",
    nameFil: "Panggigipit ng loan app",
    blurb: "Aggressive collection calls and threats from online lending apps, often to contacts of the borrower.",
  },
  {
    slug: "robocall",
    name: "Robocall / silent call",
    nameFil: "Robocall",
    blurb: "Automated or recorded calls, one-ring wangiri calls, and repeated silent calls.",
  },
  {
    slug: "job-scam",
    name: "Job offer scam",
    nameFil: "Pekeng job offer",
    blurb: "Too-good-to-be-true job offers, task scams, and recruitment fees for jobs that do not exist.",
  },
  {
    slug: "text-lottery",
    name: "Text lottery / raffle",
    nameFil: "You won! scam",
    blurb: "Messages claiming you won a raffle or promo and asking for fees or personal details to claim it.",
  },
  {
    slug: "government-impersonation",
    name: "Government impersonation",
    nameFil: "Nagpapanggap na gobyerno",
    blurb: "Callers posing as SSS, PhilHealth, NBI, BIR, or courts to demand payments or personal information.",
  },
  {
    slug: "other",
    name: "Other",
    nameFil: "Iba pa",
    blurb: "Reports that do not fit the other categories.",
  },
];

async function main() {
  for (const [telco, prefixes] of Object.entries(TELCO_PREFIXES)) {
    for (const prefix of prefixes) {
      await prisma.telcoPrefix.upsert({
        where: { prefix },
        update: { telco },
        create: { prefix, telco },
      });
    }
  }
  for (const c of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, nameFil: c.nameFil, blurb: c.blurb },
      create: c,
    });
  }
  console.log("Seeded telco prefixes and categories.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
