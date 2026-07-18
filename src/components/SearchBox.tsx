"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SearchBox({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    router.push(`/search?q=${encodeURIComponent(query)}`);
  }

  return (
    <form onSubmit={submit} role="search" className="flex w-full">
      <label htmlFor={compact ? "q-compact" : "q-hero"} className="sr-only">
        Phone number to check
      </label>
      <input
        id={compact ? "q-compact" : "q-hero"}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        inputMode="tel"
        autoComplete="off"
        placeholder={compact ? "Check a number…" : "0917 123 4567"}
        className={`tel w-full min-w-0 rounded-l-md border border-line-strong bg-card text-ink placeholder:font-sans placeholder:text-ink-faint focus:border-harbor focus:outline-none ${
          compact ? "px-3 py-1.5 text-sm" : "px-4 py-3 text-lg"
        }`}
      />
      <button
        type="submit"
        className={`shrink-0 rounded-r-md bg-harbor font-semibold text-white hover:bg-harbor-deep ${
          compact ? "px-3 py-1.5 text-sm" : "px-6 py-3"
        }`}
      >
        Check
      </button>
    </form>
  );
}
