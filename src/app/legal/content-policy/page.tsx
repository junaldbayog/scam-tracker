import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Content Policy",
  alternates: { canonical: "/legal/content-policy" },
};

export default function ContentPolicyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Content policy</h1>
      <div className="mt-6 space-y-5 text-sm leading-relaxed text-ink-soft">
        <p>
          TrackScam PH exists to document experiences with phone numbers, not
          people. These rules keep reports useful and fair.
        </p>
        <h2 className="font-display text-lg font-bold text-ink">Allowed</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>First-hand accounts of calls and texts you received</li>
          <li>The content of scam messages, including sender numbers</li>
          <li>Factual details: dates, amounts asked for, apps or brands impersonated</li>
        </ul>
        <h2 className="font-display text-lg font-bold text-ink">Not allowed</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Naming private individuals or posting their personal information (doxxing)</li>
          <li>Addresses, ID numbers, bank or e-wallet account numbers of any person</li>
          <li>Threats, harassment, hate speech, or profanity-laden posts</li>
          <li>Fabricated reports, or reports posted to harass a number's owner</li>
          <li>Links — reports containing links are held for review</li>
          <li>Commercial spam or self-promotion</li>
        </ul>
        <h2 className="font-display text-lg font-bold text-ink">Enforcement</h2>
        <p>
          First posts and reports matching risk patterns are held for review before
          publishing. Content that breaks these rules is rejected or removed, and
          repeat abuse leads to blocking. If a report about your number is false,
          use the <a href="/legal/disputes" className="text-harbor underline">dispute process</a>.
        </p>
      </div>
    </article>
  );
}
