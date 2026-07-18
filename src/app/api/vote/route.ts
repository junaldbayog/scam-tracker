import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { parseNumber, slugToQuery } from "@/lib/phone";
import { ensureFingerprint, getIpHash } from "@/lib/identity";
import { LIMITS, rateLimit } from "@/lib/rate-limit";
import { revalidatePath } from "next/cache";

const Body = z.object({
  slug: z.string().min(5).max(20),
  type: z.enum(["SCAM", "SAFE"]),
});

export async function POST(req: Request) {
  const parsedBody = Body.safeParse(await req.json().catch(() => null));
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { slug, type } = parsedBody.data;

  const parsed = parseNumber(slugToQuery(slug));
  if (!parsed || parsed.slug !== slug) {
    return NextResponse.json({ error: "Invalid phone number." }, { status: 400 });
  }

  const ipHash = await getIpHash();
  const fingerprint = await ensureFingerprint();
  const rl = rateLimit(`vote:${ipHash}`, LIMITS.vote.limit, LIMITS.vote.windowSeconds);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many votes from your connection. Try again later." },
      { status: 429 }
    );
  }

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

  const existing = await prisma.vote.findUnique({
    where: { phoneNumberId_fingerprint: { phoneNumberId: number.id, fingerprint } },
  });

  if (existing && existing.type === type) {
    return NextResponse.json({ ok: true, changed: false });
  }

  await prisma.$transaction(async (tx) => {
    if (existing) {
      await tx.vote.update({ where: { id: existing.id }, data: { type, ipHash } });
      await tx.phoneNumber.update({
        where: { id: number.id },
        data:
          type === "SCAM"
            ? { scamVotes: { increment: 1 }, safeVotes: { decrement: 1 }, lastActivityAt: new Date() }
            : { safeVotes: { increment: 1 }, scamVotes: { decrement: 1 }, lastActivityAt: new Date() },
      });
    } else {
      await tx.vote.create({
        data: { phoneNumberId: number.id, type, ipHash, fingerprint },
      });
      await tx.phoneNumber.update({
        where: { id: number.id },
        data:
          type === "SCAM"
            ? { scamVotes: { increment: 1 }, lastActivityAt: new Date() }
            : { safeVotes: { increment: 1 }, lastActivityAt: new Date() },
      });
    }
  });

  revalidatePath(`/number/${slug}`);
  return NextResponse.json({ ok: true, changed: Boolean(existing) });
}
