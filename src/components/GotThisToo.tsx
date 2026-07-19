"use client";

import { useState } from "react";

/**
 * One-tap corroboration. Turns a passive reader into a data point: "I got this
 * scam too" casts a SCAM vote via the existing /api/vote endpoint — one tap, no
 * CAPTCHA friction, deduped per browser. More corroboration = trustworthier
 * verdicts and (at the index-at-1 setting) faster discovery.
 */
export function GotThisToo({ slug }: { slug: string }) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  async function confirm() {
    if (state === "busy" || state === "done") return;
    setState("busy");
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, type: "SCAM" }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <p role="status" className="rounded-lg border border-safe bg-safe-wash px-4 py-3 text-sm font-semibold text-safe">
        Salamat! You helped warn the next person. Share it below so more people check first.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-scam/40 bg-scam-wash px-4 py-3">
      <p className="text-sm font-semibold text-ink">Did this number scam you too?</p>
      <p className="mt-0.5 text-xs text-ink-soft">One tap confirms it — no sign-up, no details needed.</p>
      <button
        onClick={confirm}
        disabled={state === "busy"}
        className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-scam px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
      >
        {state === "busy" ? "Confirming…" : "⚠️ I got this scam too"}
      </button>
      {state === "error" ? (
        <p role="alert" className="mt-2 text-xs text-scam">Couldn&apos;t record that — try again in a moment.</p>
      ) : null}
    </div>
  );
}
