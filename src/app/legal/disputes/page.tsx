import type { Metadata } from "next";
import { submitDispute } from "@/app/admin/actions";

export const metadata: Metadata = {
  title: "Is This Your Number? Dispute & Removal Process",
  description:
    "If your phone number is listed on TrackScam PH with reports you believe are false or unfair, request a review here.",
  alternates: { canonical: "/legal/disputes" },
};

export default async function DisputesPage({
  searchParams,
}: {
  searchParams: Promise<{ number?: string; sent?: string }>;
}) {
  const { number, sent } = await searchParams;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Is this your number?</h1>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-ink-soft">
        <p>
          Reports on this site are community submissions about phone numbers, and
          sometimes a number is reported unfairly — a recycled SIM, a spoofed
          caller ID, a personal dispute dressed up as a scam report.
        </p>
        <p>
          If your number is listed and you believe the reports are false, tell us
          below. A human reviews every request. If the reports can't stand up to
          scrutiny, we remove the listing from public view and from search engines.
        </p>
      </div>

      {sent === "1" ? (
        <div className="mt-6 rounded-lg border border-safe bg-safe-wash p-4 text-sm text-ink">
          <p className="font-semibold text-safe">Request received.</p>
          <p className="mt-1">
            We'll review the listing and reply to the email you provided. Most
            reviews finish within a few days.
          </p>
        </div>
      ) : (
        <form action={submitDispute} className="mt-6 space-y-4 rounded-lg border border-line bg-card p-5 shadow-sm">
          {sent && sent !== "1" ? (
            <p role="alert" className="text-sm text-scam">
              {sent === "rate"
                ? "Too many requests from your connection. Try again later."
                : sent === "badnumber"
                  ? "That doesn't look like a valid phone number."
                  : "Please fill in every field — the explanation needs at least a few sentences."}
            </p>
          ) : null}
          <div>
            <label htmlFor="dp-number" className="block text-sm font-semibold text-ink">
              The listed phone number
            </label>
            <input
              id="dp-number"
              name="number"
              required
              inputMode="tel"
              defaultValue={number ?? ""}
              placeholder="0917 123 4567"
              className="tel mt-1 w-full rounded-md border border-line-strong bg-card px-3 py-2 focus:border-harbor focus:outline-none"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="dp-name" className="block text-sm font-semibold text-ink">
                Your name
              </label>
              <input
                id="dp-name"
                name="claimantName"
                required
                maxLength={100}
                className="mt-1 w-full rounded-md border border-line-strong bg-card px-3 py-2 focus:border-harbor focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="dp-email" className="block text-sm font-semibold text-ink">
                Email for our reply
              </label>
              <input
                id="dp-email"
                name="email"
                type="email"
                required
                maxLength={200}
                className="mt-1 w-full rounded-md border border-line-strong bg-card px-3 py-2 focus:border-harbor focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label htmlFor="dp-exp" className="block text-sm font-semibold text-ink">
              Why the listing is wrong
            </label>
            <textarea
              id="dp-exp"
              name="explanation"
              required
              minLength={20}
              maxLength={3000}
              rows={5}
              placeholder="Tell us about the number — how long you've had it, what the reports claim, and why they're mistaken."
              className="mt-1 w-full rounded-md border border-line-strong bg-card px-3 py-2 text-sm focus:border-harbor focus:outline-none"
            />
          </div>
          {/* Honeypot */}
          <div className="absolute -left-[9999px]" aria-hidden="true">
            <label htmlFor="dp-web">Website</label>
            <input id="dp-web" name="website" tabIndex={-1} autoComplete="off" />
          </div>
          <button className="rounded-md bg-harbor px-6 py-2.5 font-semibold text-white hover:bg-harbor-deep">
            Submit for review
          </button>
        </form>
      )}
    </div>
  );
}
