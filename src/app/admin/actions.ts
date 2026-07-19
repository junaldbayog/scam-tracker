"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  checkPassword,
  clearAdminCookie,
  isAdmin,
  setAdminCookie,
} from "@/lib/admin-auth";
import { e164ToSlug } from "@/lib/telco";
import { LIMITS, rateLimit } from "@/lib/rate-limit";
import { getIpHash } from "@/lib/identity";
import { extractCandidateNumbers, extractCandidateNumbersWithContext, parseNumber } from "@/lib/phone";
import { scoreNumber } from "@/lib/scoring";
import { stripHtml, suggestNote } from "@/lib/curate";
import { fetchScammersPhPosts } from "@/lib/reddit";
import { verifyTurnstile } from "@/lib/turnstile";
import { notifyNewDispute } from "@/lib/notify";

async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

export type Candidate = {
  e164: string;
  slug: string;
  nationalFormat: string;
  prefix: string;
  telco: string | null;
  exists: boolean;
  scamVotes: number;
  safeVotes: number;
  reportCount: number;
  // Honest decision-support signal for the human reviewer.
  signal: "corroborated" | "conflicting" | "new" | "unknown-prefix";
  note: string;
  // Pre-filled, editable suggestion (site's own neutral words, not copied text).
  suggestedNote?: string;
  suggestedCategoryId?: string | null;
  // Raw source context around the number (testing prefill). Not stored unless published.
  context?: string;
  // Present only for the transient Reddit review result. Never saved to the DB.
  sourceUrls?: string[];
};

/**
 * Extract phone numbers from pasted text and attach an honest judgment signal
 * to each — NOT a verdict, just what the site already knows. The pasted text
 * itself is never stored or published.
 */
async function candidateDetails(parsed: ReturnType<typeof extractCandidateNumbers>): Promise<Candidate[]> {
  const out: Candidate[] = [];

  for (const p of parsed) {
    const [record, prefixRow] = await Promise.all([
      prisma.phoneNumber.findUnique({ where: { e164: p.e164 } }),
      prisma.telcoPrefix.findUnique({ where: { prefix: p.prefix } }),
    ]);
    const telco = record?.telco ?? prefixRow?.telco ?? null;
    const scamVotes = record?.scamVotes ?? 0;
    const safeVotes = record?.safeVotes ?? 0;
    const reportCount = record?.reportCount ?? 0;

    let signal: Candidate["signal"];
    let note: string;
    if (!prefixRow && p.prefix.startsWith("09")) {
      signal = "unknown-prefix";
      note = "Not a recognized PH mobile prefix — could be spoofed or a typo. Judge carefully.";
    } else if (!record || reportCount + scamVotes + safeVotes === 0) {
      signal = "new";
      note = "New to the site — no reports here yet, so this rests entirely on your source.";
    } else {
      const s = scoreNumber({ scamVotes, safeVotes, nationalFormat: p.nationalFormat, reportCount });
      if (s.verdict === "safe") {
        signal = "conflicting";
        note = `Heads up: currently voted mostly SAFE here (${100 - s.scamPct}% safe of ${s.totalVotes}). Double-check before adding a scam report.`;
      } else {
        signal = "corroborated";
        note = `Already reported here: ${reportCount} report${reportCount === 1 ? "" : "s"}, ${s.scamPct}% scam of ${s.totalVotes} vote${s.totalVotes === 1 ? "" : "s"}.`;
      }
    }

    out.push({
      e164: p.e164,
      slug: p.slug,
      nationalFormat: p.nationalFormat,
      prefix: p.prefix,
      telco,
      exists: Boolean(record),
      scamVotes,
      safeVotes,
      reportCount,
      signal,
      note,
    });
  }
  return out;
}

export async function detectNumbers(text: string): Promise<Candidate[]> {
  await requireAdmin();
  const withCtx = extractCandidateNumbersWithContext(stripHtml(text ?? ""));
  const candidates = await candidateDetails(withCtx.map((w) => w.parsed));

  const categories = await prisma.category.findMany({ select: { id: true, slug: true } });
  const slugToId = new Map(categories.map((c) => [c.slug, c.id]));
  const ctxByE164 = new Map(withCtx.map((w) => [w.parsed.e164, w.context]));

  return candidates.map((c) => {
    const rawContext = ctxByE164.get(c.e164) ?? "";
    // Strip the leading number token so the prefill is just the description.
    const context = rawContext.replace(/^\+?\d[\d\s().-]{6,}\d\s*/, "").trim();
    const s = suggestNote(rawContext);
    return {
      ...c,
      suggestedNote: s.note,
      suggestedCategoryId: s.categorySlug ? slugToId.get(s.categorySlug) ?? null : null,
      context,
    };
  });
}

/**
 * Pulls only recent text posts through Reddit's official Data API, detects
 * numbers, and returns them for an admin to review. Post text is not stored,
 * displayed, or published by this app.
 */
export async function importRedditCandidates(): Promise<{
  candidates: Candidate[];
  postCount: number;
  error?: string;
}> {
  await requireAdmin();
  try {
    const posts = await fetchScammersPhPosts();
    const sources = new Map<string, Set<string>>();
    const byNumber = new Map<string, ReturnType<typeof extractCandidateNumbers>[number]>();
    for (const post of posts) {
      for (const parsed of extractCandidateNumbers(post.text)) {
        byNumber.set(parsed.e164, parsed);
        const urls = sources.get(parsed.e164) ?? new Set<string>();
        urls.add(post.url);
        sources.set(parsed.e164, urls);
      }
    }
    const candidates = await candidateDetails([...byNumber.values()]);
    return {
      postCount: posts.length,
      candidates: candidates.map((candidate) => ({
        ...candidate,
        sourceUrls: [...(sources.get(candidate.e164) ?? [])].slice(0, 5),
      })),
    };
  } catch (error) {
    return {
      candidates: [],
      postCount: 0,
      error: error instanceof Error ? error.message : "Reddit import failed.",
    };
  }
}

/** Publish one admin-curated number as an unverified community report. */
export async function curateNumber(formData: FormData): Promise<void> {
  await requireAdmin();
  const parsed = parseNumber(String(formData.get("number") ?? ""));
  if (!parsed) return;

  const categoryId = formData.get("categoryId")
    ? (await prisma.category.findUnique({ where: { id: String(formData.get("categoryId")) } }))?.id ?? null
    : null;
  const markScam = formData.get("markScam") === "on";

  // Provenance for public-advisory ingestion: a short, human-entered label like
  // "NTC Advisory 2026-03-15" or "BSP Consumer Advisory". Stored as seedSource,
  // which both attributes the number and (via visibility.ts) makes the page
  // indexable immediately — an official source is corroboration on its own.
  const source = String(formData.get("source") ?? "").replace(/[<>]/g, "").trim().slice(0, 80);
  const seedSource = source || "admin-curated";
  const displayName = source ? "TrackScam PH (from public advisory)" : "TrackScam PH (reviewer)";

  // The published text is the admin's own neutral words, or a generic line —
  // never the pasted source content.
  const summary = String(formData.get("summary") ?? "").trim().slice(0, 2000);
  const fallback = source
    ? `Flagged in a public scam advisory (${source}). Vote and add details below.`
    : "Flagged by a reviewer as a possible scam number, based on community discussion. Unverified — vote and add details below.";
  const body = summary || fallback;

  const telco = (await prisma.telcoPrefix.findUnique({ where: { prefix: parsed.prefix } }))?.telco;

  const number = await prisma.phoneNumber.upsert({
    where: { e164: parsed.e164 },
    // Corroborating an existing number with a named advisory upgrades its
    // provenance; a plain admin add leaves any richer source already set.
    update: source ? { seedSource } : {},
    create: {
      e164: parsed.e164,
      nationalFormat: parsed.nationalFormat,
      prefix: parsed.prefix,
      telco,
      seedSource,
    },
  });
  if (number.status === "DELISTED") return;

  await prisma.$transaction(async (tx) => {
    await tx.comment.create({
      data: {
        phoneNumberId: number.id,
        body,
        displayName,
        categoryId,
        ipHash: "curated",
        fingerprint: "curated",
        status: "APPROVED",
      },
    });
    let voteInc = {};
    if (markScam) {
      const existing = await tx.vote.findUnique({
        where: { phoneNumberId_fingerprint: { phoneNumberId: number.id, fingerprint: "curated" } },
      });
      if (!existing) {
        await tx.vote.create({ data: { phoneNumberId: number.id, type: "SCAM", ipHash: "curated", fingerprint: "curated" } });
        voteInc = { scamVotes: { increment: 1 } };
      }
    }
    await tx.phoneNumber.update({
      where: { id: number.id },
      data: { reportCount: { increment: 1 }, lastActivityAt: new Date(), ...voteInc },
    });
  });

  revalidatePath(`/number/${parsed.slug}`);
  revalidatePath("/admin/curate");
}

export async function login(formData: FormData) {
  const ipHash = await getIpHash();
  const rl = rateLimit(`admin-login:${ipHash}`, 5, 900);
  if (!rl.ok) redirect("/admin/login?error=rate");
  const password = String(formData.get("password") ?? "");
  if (!checkPassword(password)) redirect("/admin/login?error=1");
  await setAdminCookie();
  redirect("/admin");
}

export async function logout() {
  await clearAdminCookie();
  redirect("/admin/login");
}

export async function moderateComment(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const action = String(formData.get("action")); // approve | reject
  const comment = await prisma.comment.findUnique({
    where: { id },
    include: { phoneNumber: true },
  });
  if (!comment) return;

  const newStatus = action === "approve" ? "APPROVED" : "REJECTED";
  if (comment.status === newStatus) return;

  await prisma.$transaction(async (tx) => {
    await tx.comment.update({ where: { id }, data: { status: newStatus } });
    // reportCount tracks APPROVED comments only.
    if (newStatus === "APPROVED" && comment.status !== "APPROVED") {
      await tx.phoneNumber.update({
        where: { id: comment.phoneNumberId },
        data: { reportCount: { increment: 1 } },
      });
    } else if (comment.status === "APPROVED" && newStatus === "REJECTED") {
      await tx.phoneNumber.update({
        where: { id: comment.phoneNumberId },
        data: { reportCount: { decrement: 1 } },
      });
    }
  });

  revalidatePath(`/number/${e164ToSlug(comment.phoneNumber.e164)}`);
  revalidatePath("/admin");
}

export async function resolveDispute(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const action = String(formData.get("action")); // delist | dismiss
  const note = String(formData.get("note") ?? "");
  const dispute = await prisma.disputeRequest.findUnique({
    where: { id },
    include: { phoneNumber: true },
  });
  if (!dispute) return;

  await prisma.$transaction(async (tx) => {
    await tx.disputeRequest.update({
      where: { id },
      data: {
        status: action === "delist" ? "RESOLVED" : "DISMISSED",
        adminNote: note || null,
        resolvedAt: new Date(),
      },
    });
    if (action === "delist") {
      await tx.phoneNumber.update({
        where: { id: dispute.phoneNumberId },
        data: { status: "DELISTED" },
      });
    }
  });

  revalidatePath(`/number/${e164ToSlug(dispute.phoneNumber.e164)}`);
  revalidatePath("/admin/disputes");
}

export async function setNumberStatus(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  if (!["ACTIVE", "DISPUTED", "DELISTED"].includes(status)) return;
  const number = await prisma.phoneNumber.update({
    where: { id },
    data: { status: status as "ACTIVE" | "DISPUTED" | "DELISTED" },
  });
  revalidatePath(`/number/${e164ToSlug(number.e164)}`);
  revalidatePath("/admin/numbers");
}

export async function submitDispute(formData: FormData) {
  // Public action (linked from number pages) — rate limited, no auth.
  const ipHash = await getIpHash();
  const rl = rateLimit(`dispute:${ipHash}`, LIMITS.dispute.limit, LIMITS.dispute.windowSeconds);
  if (!rl.ok) redirect("/legal/disputes?sent=rate");

  const number = String(formData.get("number") ?? "").trim();
  const claimantName = String(formData.get("claimantName") ?? "").trim().slice(0, 100);
  const email = String(formData.get("email") ?? "").trim().slice(0, 200);
  const explanation = String(formData.get("explanation") ?? "").trim().slice(0, 3000);
  const website = String(formData.get("website") ?? ""); // honeypot
  if (website) redirect("/legal/disputes?sent=1");
  if (!claimantName || !email.includes("@") || explanation.length < 20) {
    redirect("/legal/disputes?sent=invalid");
  }

  if (!(await verifyTurnstile(String(formData.get("turnstileToken") ?? "") || undefined))) {
    redirect("/legal/disputes?sent=captcha");
  }

  const { parseNumber } = await import("@/lib/phone");
  const parsed = parseNumber(number);
  if (!parsed) redirect("/legal/disputes?sent=badnumber");

  const record = await prisma.phoneNumber.findUnique({ where: { e164: parsed.e164 } });
  if (record) {
    await prisma.disputeRequest.create({
      data: {
        phoneNumberId: record.id,
        claimantName,
        email,
        explanation,
      },
    });
    // Alert a human — this is the takedown safety net; it can't sit unseen.
    await notifyNewDispute({ number: parsed.nationalFormat, claimantName, email, explanation });
  }
  // Same response whether or not the number exists — no data leaks.
  redirect("/legal/disputes?sent=1");
}
