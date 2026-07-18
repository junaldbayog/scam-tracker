import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { parseNumber } from "@/lib/phone";
import { ensureFingerprint, getIpHash } from "@/lib/identity";
import { LIMITS, rateLimit } from "@/lib/rate-limit";
import { checkComment, checkDisplayName } from "@/lib/moderation";
import { revalidatePath } from "next/cache";

const Body = z.object({
  number: z.string().min(5).max(30),
  body: z.string().min(1).max(5000),
  displayName: z.string().max(60).optional().default(""),
  categoryId: z.string().nullable().optional(),
  markScam: z.boolean().optional().default(true),
  website: z.string().optional().default(""), // honeypot
});

export async function POST(req: Request) {
  const parsedBody = Body.safeParse(await req.json().catch(() => null));
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const input = parsedBody.data;

  if (input.website) {
    // Honeypot filled → pretend success, store nothing.
    return NextResponse.json({ ok: true, slug: "0000" });
  }

  const parsed = parseNumber(input.number);
  if (!parsed) {
    return NextResponse.json(
      { error: "That doesn't look like a valid phone number. Check the digits and try again." },
      { status: 400 }
    );
  }

  const ipHash = await getIpHash();
  const rl = rateLimit(`report:${ipHash}`, LIMITS.report.limit, LIMITS.report.windowSeconds);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many reports from your connection. Try again later." },
      { status: 429 }
    );
  }

  const fingerprint = await ensureFingerprint();

  const check = checkComment(input.body);
  if (check.action === "reject") {
    return NextResponse.json(
      {
        error: check.reasons.includes("too_short")
          ? "Please write at least a short sentence about what happened."
          : "That report is too long — keep it under 2,000 characters.",
      },
      { status: 400 }
    );
  }

  const categoryId = input.categoryId
    ? (await prisma.category.findUnique({ where: { id: input.categoryId } }))?.id ?? null
    : null;

  const number = await prisma.phoneNumber.upsert({
    where: { e164: parsed.e164 },
    update: {},
    create: {
      e164: parsed.e164,
      nationalFormat: parsed.nationalFormat,
      prefix: parsed.prefix,
      telco: (await prisma.telcoPrefix.findUnique({ where: { prefix: parsed.prefix } }))?.telco,
    },
  });

  if (number.status === "DELISTED") {
    return NextResponse.json({ error: "This number is not accepting reports." }, { status: 403 });
  }

  const status = check.action === "approve" ? "APPROVED" : "PENDING";

  await prisma.$transaction(async (tx) => {
    await tx.comment.create({
      data: {
        phoneNumberId: number.id,
        body: check.cleaned,
        displayName: checkDisplayName(input.displayName),
        categoryId,
        ipHash,
        fingerprint,
        status,
      },
    });

    let voteInc = {};
    if (input.markScam) {
      const existing = await tx.vote.findUnique({
        where: { phoneNumberId_fingerprint: { phoneNumberId: number.id, fingerprint } },
      });
      if (!existing) {
        await tx.vote.create({
          data: { phoneNumberId: number.id, type: "SCAM", ipHash, fingerprint },
        });
        voteInc = { scamVotes: { increment: 1 } };
      }
    }

    await tx.phoneNumber.update({
      where: { id: number.id },
      data: {
        lastActivityAt: new Date(),
        ...(status === "APPROVED" ? { reportCount: { increment: 1 } } : {}),
        ...voteInc,
      },
    });
  });

  revalidatePath(`/number/${parsed.slug}`);
  return NextResponse.json({ ok: true, slug: parsed.slug, status });
}
