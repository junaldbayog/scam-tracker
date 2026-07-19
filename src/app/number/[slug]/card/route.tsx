import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";
import { parseNumber, slugToQuery } from "@/lib/phone";
import { scoreNumber } from "@/lib/scoring";

/**
 * Forwardable warning card (portrait PNG, chat-sized). Unlike the landscape OG
 * image used for link previews, this is built to be *saved and forwarded as an
 * image* in Messenger/Viber/FB group chats — the way Filipinos actually pass
 * scam warnings around. The site URL is baked large into the card so even a
 * screenshotted re-share still tells people where to check.
 */
export const runtime = "nodejs";

const SIZE = { width: 1080, height: 1350 };

const VERDICT_COLORS: Record<string, string> = {
  scam: "#bb3325",
  caution: "#a06c00",
  safe: "#1e7047",
  unverified: "#51606d",
};

function displayHost(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? "trackscam.ph";
  return raw.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const parsed = parseNumber(slugToQuery(decodeURIComponent(slug)));
  const record = parsed
    ? await prisma.phoneNumber.findUnique({ where: { e164: parsed.e164 } })
    : null;

  const score = scoreNumber({
    scamVotes: record?.scamVotes ?? 0,
    safeVotes: record?.safeVotes ?? 0,
    nationalFormat: parsed?.nationalFormat ?? slug,
    reportCount: record?.reportCount ?? 0,
    telco: record?.telco,
  });
  const color = VERDICT_COLORS[score.verdict];
  const scam = score.verdict === "scam";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#f5f6f5",
          padding: 72,
          fontFamily: "monospace",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ fontSize: 48, fontWeight: 700, color: "#0e3b4d" }}>TrackScam</div>
          <div
            style={{
              background: "#16556e",
              color: "#fff",
              fontSize: 28,
              fontWeight: 700,
              padding: "6px 14px",
              borderRadius: 6,
            }}
          >
            PH
          </div>
        </div>

        <div
          style={{
            marginTop: 64,
            display: "flex",
            flexDirection: "column",
            background: "#ffffff",
            border: "3px solid #dde2e5",
            borderRadius: 24,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: color,
              color: "#fff",
              fontSize: 44,
              fontWeight: 700,
              padding: "26px 40px",
              letterSpacing: 4,
              textTransform: "uppercase",
              textAlign: "center",
            }}
          >
            {scam ? "⚠️ " : ""}
            {score.label}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "56px 40px" }}>
            <div style={{ fontSize: 128, fontWeight: 700, color: "#182430", letterSpacing: 2 }}>
              {parsed?.nationalFormat ?? slug}
            </div>
            <div style={{ marginTop: 28, fontSize: 40, color: "#51606d", textAlign: "center" }}>
              {score.totalVotes > 0
                ? `${score.scamPct}% of ${score.totalVotes} votes say scam · ${record?.reportCount ?? 0} report${(record?.reportCount ?? 0) === 1 ? "" : "s"}`
                : "Check the community reports for this number"}
            </div>
            <div style={{ marginTop: 24, fontSize: 28, color: "#8b98a3", textAlign: "center" }}>
              Community-reported · Unverified · Use your own judgment
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: "auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 40, color: "#182430", fontWeight: 700, textAlign: "center" }}>
            Check any number for FREE
          </div>
          <div style={{ fontSize: 52, color: "#16556e", fontWeight: 700, marginTop: 8 }}>
            {displayHost()}
          </div>
        </div>
      </div>
    ),
    SIZE
  );
}
