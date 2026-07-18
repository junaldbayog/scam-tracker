"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function VoteButtons({ slug }: { slug: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "busy" | "voted">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function vote(type: "SCAM" | "SAFE") {
    if (state === "busy") return;
    setState("busy");
    setMessage(null);
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, type }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState("idle");
        setMessage(data.error ?? "Something went wrong. Try again.");
        return;
      }
      setState("voted");
      setMessage(
        data.changed
          ? "Vote updated. Salamat!"
          : "Vote recorded. Salamat sa report!"
      );
      router.refresh();
    } catch {
      setState("idle");
      setMessage("Network error. Try again.");
    }
  }

  return (
    <div>
      <p className="text-sm font-semibold text-ink">
        Did this number call or text you?
      </p>
      <div className="mt-2 flex items-stretch gap-2.5">
        {/* Primary action — most voters are reporting a bad call. */}
        <button
          onClick={() => vote("SCAM")}
          disabled={state !== "idle"}
          className="flex flex-[2] items-center justify-center gap-2 rounded-md bg-scam px-4 py-3.5 font-display text-base font-bold text-white shadow-sm transition-colors hover:bg-[color-mix(in_srgb,var(--scam)_85%,black)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <WarningIcon />
          Report as scam
        </button>
        {/* Secondary — kept clearly usable so scam tags stay credible. */}
        <button
          onClick={() => vote("SAFE")}
          disabled={state !== "idle"}
          className="flex-1 rounded-md border-2 border-safe bg-card px-3 py-3.5 font-display text-sm font-bold text-safe transition-colors hover:bg-safe hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          It&rsquo;s safe
        </button>
      </div>
      {message ? (
        <p className="mt-2 text-sm text-ink-soft" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}

function WarningIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
