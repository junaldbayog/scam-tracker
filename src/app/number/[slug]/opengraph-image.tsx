import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";
import { parseNumber, slugToQuery } from "@/lib/phone";
import { scoreNumber } from "@/lib/scoring";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Scam report summary for a phone number";

const VERDICT_COLORS: Record<string, string> = {
  scam: "#bb3325",
  caution: "#a06c00",
  safe: "#1e7047",
  unverified: "#51606d",
};

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
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

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#f5f6f5",
          padding: 64,
          fontFamily: "monospace",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 34, fontWeight: 700, color: "#0e3b4d" }}>TrackScam</div>
          <div
            style={{
              background: "#16556e",
              color: "#fff",
              fontSize: 20,
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: 4,
            }}
          >
            PH
          </div>
        </div>

        <div
          style={{
            marginTop: 60,
            display: "flex",
            flexDirection: "column",
            background: "#ffffff",
            border: "2px solid #dde2e5",
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              background: color,
              color: "#fff",
              fontSize: 28,
              fontWeight: 700,
              padding: "14px 40px",
              letterSpacing: 4,
              textTransform: "uppercase",
            }}
          >
            {score.label}
          </div>
          <div style={{ display: "flex", flexDirection: "column", padding: 40 }}>
            <div style={{ fontSize: 88, fontWeight: 700, color: "#182430" }}>
              {parsed?.nationalFormat ?? slug}
            </div>
            <div style={{ marginTop: 18, fontSize: 32, color: "#51606d" }}>
              {score.totalVotes > 0
                ? `${score.scamPct}% of ${score.totalVotes} votes say scam · ${record?.reportCount ?? 0} reports`
                : "Check community reports for this number"}
            </div>
          </div>
        </div>

        <div style={{ marginTop: "auto", fontSize: 26, color: "#8b98a3" }}>
          Community scam-number registry · Free, no sign-up
        </div>
      </div>
    ),
    size
  );
}
