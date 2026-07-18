import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use",
  alternates: { canonical: "/legal/terms" },
};

export default function TermsPage() {
  return (
    <article className="prose-custom mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Terms of use</h1>
      <div className="mt-6 space-y-5 text-sm leading-relaxed text-ink-soft">
        <p>
          TrackScam PH is a community platform where people share their experiences
          with phone calls and text messages. By using the site, you agree to these terms.
        </p>
        <h2 className="font-display text-lg font-bold text-ink">What this site is</h2>
        <p>
          Reports, votes, and comments are submitted by anonymous members of the
          public. They are personal accounts and opinions — not verified facts, not
          accusations endorsed by this site, and not proof that any person or
          number has committed a crime. Always use your own judgment.
        </p>
        <h2 className="font-display text-lg font-bold text-ink">Your submissions</h2>
        <p>
          Post only your own genuine experience. Do not post personal information
          about any individual (names, addresses, ID numbers, account numbers),
          threats, harassment, or content you know to be false. You grant us the
          right to display, edit for safety, or remove your submission at any time.
        </p>
        <h2 className="font-display text-lg font-bold text-ink">Moderation and removal</h2>
        <p>
          We review flagged content and disputes and may remove reports or delist
          numbers at our discretion, including where content appears false,
          abusive, or unlawful. See our content policy and dispute process.
        </p>
        <h2 className="font-display text-lg font-bold text-ink">No warranties</h2>
        <p>
          The site is provided as-is. We make no guarantee that information here
          is accurate or complete, and we are not liable for decisions made based
          on it.
        </p>
      </div>
    </article>
  );
}
