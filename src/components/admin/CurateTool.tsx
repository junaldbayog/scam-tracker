"use client";

import { useState } from "react";
import { type Candidate, curateNumber, detectNumbers, importRedditCandidates } from "@/app/admin/actions";

type Category = { id: string; name: string };

const SIGNAL_STYLE: Record<Candidate["signal"], { label: string; cls: string }> = {
  corroborated: { label: "Corroborated here", cls: "bg-safe-wash text-safe" },
  conflicting: { label: "Conflicting votes", cls: "bg-caution-wash text-caution" },
  new: { label: "New — your source only", cls: "bg-neutral-wash text-ink-soft" },
  "unknown-prefix": { label: "Unknown prefix", cls: "bg-scam-wash text-scam" },
};

export function CurateTool({ categories }: { categories: Category[] }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [added, setAdded] = useState<Record<string, boolean>>({});
  const [importNote, setImportNote] = useState<string | null>(null);

  async function detect() {
    setBusy(true);
    try {
      setCandidates(await detectNumbers(text));
      setAdded({});
      setImportNote(null);
    } finally {
      setBusy(false);
    }
  }

  async function importReddit() {
    setBusy(true);
    try {
      const result = await importRedditCandidates();
      setCandidates(result.candidates);
      setAdded({});
      setImportNote(result.error ?? `Reviewed ${result.postCount} recent r/ScammersPH text posts. Nothing has been published.`);
    } finally {
      setBusy(false);
    }
  }

  async function add(c: Candidate, formEl: HTMLFormElement) {
    const fd = new FormData(formEl);
    fd.set("number", c.slug);
    await curateNumber(fd);
    setAdded((prev) => ({ ...prev, [c.e164]: true }));
  }

  return (
    <div>
      <p className="mb-3 rounded-md border border-line bg-harbor-wash px-4 py-2.5 text-sm text-ink-soft">
        Paste text you&rsquo;ve read from a source. We extract only the numbers —
        never the pasted content — and show what the site already knows so you can
        judge each one. Add only numbers you personally find credible.
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        placeholder="Paste a thread, your notes, a message… anything with phone numbers in it."
        className="w-full rounded-md border border-line-strong bg-card px-3 py-2 text-sm focus:border-harbor focus:outline-none"
      />
      <div className="mt-2">
        <button
          onClick={detect}
          disabled={busy || text.trim().length < 3}
          className="rounded-md bg-harbor px-4 py-2 text-sm font-semibold text-white hover:bg-harbor-deep disabled:opacity-50"
        >
          {busy ? "Scanning…" : "Detect numbers"}
        </button>
      </div>

      <div className="mt-5 border-t border-line pt-4">
        <p className="text-sm font-semibold text-ink">Import candidates from r/ScammersPH</p>
        <p className="mt-1 text-sm text-ink-soft">
          Uses Reddit&rsquo;s official API to find numbers in recent text posts. The posts are never stored or copied to your site; open each source and make your own judgment before publishing.
        </p>
        <button
          onClick={importReddit}
          disabled={busy}
          className="mt-2 rounded-md border border-harbor px-4 py-2 text-sm font-semibold text-harbor hover:bg-harbor-wash disabled:opacity-50"
        >
          {busy ? "Checking Reddit…" : "Load recent Reddit candidates"}
        </button>
        {importNote ? <p className="mt-2 text-sm text-ink-soft">{importNote}</p> : null}
      </div>

      {candidates ? (
        <div className="mt-6">
          <h2 className="font-display text-lg font-bold text-ink">
            Detected{" "}
            <span className="text-ink-faint">({candidates.length})</span>
          </h2>
          {candidates.length === 0 ? (
            <p className="mt-3 rounded-lg border border-dashed border-line-strong bg-card px-4 py-6 text-center text-sm text-ink-soft">
              No valid phone numbers found in that text.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {candidates.map((c) => {
                const sig = SIGNAL_STYLE[c.signal];
                return (
                  <li key={c.e164} className="rounded-lg border border-line bg-card p-4 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="tel text-lg font-semibold text-ink">{c.nationalFormat}</span>
                      <span className="text-xs text-ink-faint">{c.telco ?? "unknown network"}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${sig.cls}`}>
                        {sig.label}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-ink-soft">{c.note}</p>
                    {c.sourceUrls?.length ? (
                      <p className="mt-2 text-xs text-ink-faint">
                        Source{c.sourceUrls.length === 1 ? "" : "s"}: {c.sourceUrls.map((url, i) => (
                          <span key={url}>{i ? " · " : ""}<a href={url} target="_blank" rel="noreferrer" className="text-harbor hover:underline">Open Reddit post</a></span>
                        ))}
                      </p>
                    ) : null}

                    {added[c.e164] ? (
                      <p className="mt-3 text-sm font-semibold text-safe">Added ✓</p>
                    ) : (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          add(c, e.currentTarget);
                        }}
                        className="mt-3 space-y-2"
                      >
                        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                          <input
                            name="summary"
                            maxLength={2000}
                            defaultValue={c.context || c.suggestedNote || ""}
                            placeholder="Suggested note — edit or clear it (don't paste the original post)"
                            className="w-full rounded-md border border-line-strong bg-card px-3 py-2 text-sm focus:border-harbor focus:outline-none"
                          />
                          <select
                            name="categoryId"
                            defaultValue={c.suggestedCategoryId ?? ""}
                            className="rounded-md border border-line-strong bg-card px-3 py-2 text-sm focus:border-harbor focus:outline-none"
                          >
                            <option value="">No category</option>
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                          </select>
                        </div>
                        <label className="flex items-center gap-2 text-sm text-ink">
                          <input type="checkbox" name="markScam" defaultChecked className="h-4 w-4 accent-[var(--scam)]" />
                          Cast a scam vote too
                        </label>
                        <div className="flex gap-2">
                          <button className="rounded-md bg-harbor px-4 py-1.5 text-sm font-semibold text-white hover:bg-harbor-deep">
                            Add as report
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdded((prev) => ({ ...prev, [c.e164]: true }))}
                            className="rounded-md border border-line px-4 py-1.5 text-sm font-semibold text-ink-soft hover:border-line-strong"
                          >
                            Skip
                          </button>
                        </div>
                      </form>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
