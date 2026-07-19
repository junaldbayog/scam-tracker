"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

type Category = { id: string; slug: string; name: string };

export function ReportForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const turnstileToken = useRef<string>("");
  const turnstileRef = useRef<HTMLDivElement>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number: fd.get("number"),
          body: fd.get("body"),
          displayName: fd.get("displayName") || "",
          categoryId: fd.get("categoryId") || null,
          markScam: fd.get("markScam") === "on",
          website: fd.get("website") || "", // honeypot
          turnstileToken: turnstileToken.current,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Try again.");
        setBusy(false);
        return;
      }
      router.push(`/number/${data.slug}?reported=1`);
    } catch {
      setError("Network error. Try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="rf-number" className="block text-sm font-semibold text-ink">
          Phone number
        </label>
        <input
          id="rf-number"
          name="number"
          required
          inputMode="tel"
          placeholder="0917 123 4567"
          className="tel mt-1 w-full rounded-md border border-line-strong bg-card px-3 py-2.5 text-lg focus:border-harbor focus:outline-none"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="rf-cat" className="block text-sm font-semibold text-ink">
            Type of scam
          </label>
          <select
            id="rf-cat"
            name="categoryId"
            className="mt-1 w-full rounded-md border border-line-strong bg-card px-3 py-2 text-sm focus:border-harbor focus:outline-none"
          >
            <option value="">Choose a type…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="rf-name" className="block text-sm font-semibold text-ink">
            Your name <span className="font-normal text-ink-faint">(optional)</span>
          </label>
          <input
            id="rf-name"
            name="displayName"
            maxLength={40}
            placeholder="Anonymous"
            className="mt-1 w-full rounded-md border border-line-strong bg-card px-3 py-2 text-sm focus:border-harbor focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label htmlFor="rf-body" className="block text-sm font-semibold text-ink">
          What happened?
        </label>
        <textarea
          id="rf-body"
          name="body"
          required
          minLength={10}
          maxLength={2000}
          rows={5}
          placeholder="Describe the call or text — what they said, what they asked for. Don't include your own personal details."
          className="mt-1 w-full rounded-md border border-line-strong bg-card px-3 py-2 text-sm focus:border-harbor focus:outline-none"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" name="markScam" defaultChecked className="h-4 w-4 accent-[var(--scam)]" />
        Also cast a <span className="font-bold text-scam">Scam</span> vote for this number
      </label>

      {/* Honeypot */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label htmlFor="rf-web">Website</label>
        <input id="rf-web" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {siteKey ? (
        <>
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js"
            onLoad={() => {
              if (turnstileRef.current && window.turnstile) {
                window.turnstile.render(turnstileRef.current, {
                  sitekey: siteKey,
                  callback: (t) => (turnstileToken.current = t),
                });
              }
            }}
          />
          <div ref={turnstileRef} />
        </>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-harbor px-6 py-2.5 font-semibold text-white hover:bg-harbor-deep disabled:opacity-50"
        >
          {busy ? "Submitting…" : "Submit report"}
        </button>
        {error ? <p role="alert" className="text-sm text-scam">{error}</p> : null}
      </div>
    </form>
  );
}
