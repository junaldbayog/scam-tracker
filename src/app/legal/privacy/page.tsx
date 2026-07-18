import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  alternates: { canonical: "/legal/privacy" },
};

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Privacy policy</h1>
      <div className="mt-6 space-y-5 text-sm leading-relaxed text-ink-soft">
        <p>
          This policy describes how TrackScam PH handles personal data, consistent
          with the Philippine Data Privacy Act of 2012 (RA 10173).
        </p>
        <h2 className="font-display text-lg font-bold text-ink">What we collect</h2>
        <p>
          <span className="font-semibold text-ink">From visitors:</span> nothing that
          identifies you. Browsing requires no account and no personal details.
        </p>
        <p>
          <span className="font-semibold text-ink">When you vote or post:</span> the
          content you submit, an optional display name, a random browser
          identifier (cookie) used to prevent duplicate votes, and a one-way
          salted hash of your IP address used for rate limiting and abuse
          prevention. We do not store raw IP addresses.
        </p>
        <p>
          <span className="font-semibold text-ink">Phone numbers on the site:</span>{" "}
          numbers are submitted by the community as numbers that contacted them.
          We do not obtain or publish subscriber identity information from telcos
          or any other source.
        </p>
        <h2 className="font-display text-lg font-bold text-ink">How we use it</h2>
        <p>
          To display community reports, prevent spam and vote manipulation, and
          moderate content. We do not sell personal data. The site may show
          advertising in the future; any advertising partner will receive only
          standard, non-identifying page context.
        </p>
        <h2 className="font-display text-lg font-bold text-ink">Your rights</h2>
        <p>
          Under the Data Privacy Act you may request access to, correction of, or
          deletion of personal data you submitted. If a listed number is yours
          and you believe reports are false or unfair, use the{" "}
          <a href="/legal/disputes" className="text-harbor underline">dispute process</a>.
          For other requests, contact the site operator.
        </p>
        <h2 className="font-display text-lg font-bold text-ink">Retention</h2>
        <p>
          Reports and votes are retained while they remain relevant to the site's
          purpose of warning the public. Delisted numbers and rejected content are
          removed from public view.
        </p>
      </div>
    </article>
  );
}
