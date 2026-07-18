"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

type Category = { id: string; slug: string; name: string };

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: { sitekey: string; callback: (t: string) => void }) => void;
    };
  }
}

export function CommentForm({ slug, categories }: { slug: string; categories: Category[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const turnstileToken = useRef<string>("");
  const turnstileRef = useRef<HTMLDivElement>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setResult(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          body: fd.get("body"),
          displayName: fd.get("displayName") || "",
          categoryId: fd.get("categoryId") || null,
          website: fd.get("website") || "", // honeypot
          turnstileToken: turnstileToken.current,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ ok: false, message: data.error ?? "Something went wrong. Try again." });
      } else {
        form.reset();
        setResult({
          ok: true,
          message:
            data.status === "APPROVED"
              ? "Report posted. Salamat!"
              : "Report received — it will appear after a quick review.",
        });
        router.refresh();
      }
    } catch {
      setResult({ ok: false, message: "Network error. Try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="cf-name" className="block text-xs font-semibold text-ink-soft">
            Name <span className="font-normal text-ink-faint">(optional)</span>
          </label>
          <input
            id="cf-name"
            name="displayName"
            maxLength={40}
            placeholder="Anonymous"
            className="mt-1 w-full rounded-md border border-line-strong bg-card px-3 py-2 text-sm focus:border-harbor focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="cf-cat" className="block text-xs font-semibold text-ink-soft">
            What kind of call or text?
          </label>
          <select
            id="cf-cat"
            name="categoryId"
            className="mt-1 w-full rounded-md border border-line-strong bg-card px-3 py-2 text-sm focus:border-harbor focus:outline-none"
          >
            <option value="">Choose a type…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="cf-body" className="block text-xs font-semibold text-ink-soft">
          What happened?
        </label>
        <textarea
          id="cf-body"
          name="body"
          required
          minLength={10}
          maxLength={2000}
          rows={4}
          placeholder="Describe the call or text — what they said, what they asked for. Don't include your own personal details."
          className="mt-1 w-full rounded-md border border-line-strong bg-card px-3 py-2 text-sm focus:border-harbor focus:outline-none"
        />
      </div>

      {/* Honeypot — hidden from humans, bots fill it */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label htmlFor="cf-web">Website</label>
        <input id="cf-web" name="website" tabIndex={-1} autoComplete="off" />
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
          className="rounded-md bg-harbor px-5 py-2 font-semibold text-white hover:bg-harbor-deep disabled:opacity-50"
        >
          {busy ? "Posting…" : "Post report"}
        </button>
        {result ? (
          <p role="status" className={`text-sm ${result.ok ? "text-safe" : "text-scam"}`}>
            {result.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
