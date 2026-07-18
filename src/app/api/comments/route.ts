import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { parseNumber, slugToQuery } from "@/lib/phone";
import { ensureFingerprint, getIpHash } from "@/lib/identity";
import { LIMITS, rateLimit } from "@/lib/rate-limit";
import { checkComment, checkDisplayName } from "@/lib/moderation";
import { verifyTurnstile } from "@/lib/turnstile";
import { revalidatePath } from "next/cache";

const Body = z.object({
  slug: z.string().min(5).max(20),
  body: z.string().min(1).max(5000),
  displayName: z.string().max(60).optional().default(""),
  categoryId: z.string().nullable().optional(),
  website: z.string().optional().default(""), // honeypot
  turnstileToken: z.string().optional(),
});

export async function POST(req: Request) {
  const parsedBody = Body.safeParse(await req.json().catch(() => null));
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const input = parsedBody.data;

  // Honeypot filled → pretend success, store nothing.
  if (input.website) {
    return NextResponse.json({ ok: true, status: "PENDING" });
  }

  const parsed = parseNumber(slugToQuery(input.slug));
  if (!parsed || parsed.slug !== input.slug) {
    return NextResponse.json({ error: "Invalid phone number." }, { status: 400 });
  }

  const ipHash = await getIpHash();
  const rl = rateLimit(`comment:${ipHash}`, LIMITS.comment.limit, LIMITS.comment.windowSeconds);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "You're posting too fast. Try again in an hour." },
      { status: 429 }
    );
  }

  if (!(await verifyTurnstile(input.turnstileToken))) {
    return NextResponse.json(
      { error: "Verification failed. Refresh the page and try again." },
      { status: 400 }
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
    await tx.phoneNumber.update({
      where: { id: number.id },
      data: {
        lastActivityAt: new Date(),
        ...(status === "APPROVED" ? { reportCount: { increment: 1 } } : {}),
      },
    });
  });

  revalidatePath(`/number/${input.slug}`);
  return NextResponse.json({ ok: true, status });
}
