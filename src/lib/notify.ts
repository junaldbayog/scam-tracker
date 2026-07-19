/**
 * Best-effort, out-of-band alerts for events a human must act on soon.
 *
 * The dispute → DELIST takedown flow is the site's reactive safety net against
 * false/defamatory listings, so a new dispute cannot sit silently in a table.
 * This posts to DISPUTE_WEBHOOK_URL (a Slack- or Discord-compatible incoming
 * webhook — just a `{ text }` JSON body) when configured, and ALWAYS logs so
 * the event is visible in server logs even without a webhook.
 *
 * It must never throw or meaningfully delay the user action it accompanies:
 * failures are swallowed and the call is time-boxed.
 */
export async function notifyNewDispute(info: {
  number: string;
  claimantName: string;
  email: string;
  explanation: string;
}): Promise<void> {
  const headline = `🚩 New TrackScam dispute for ${info.number} from ${info.claimantName} <${info.email}>`;
  // Always land in server logs (Vercel/host log drain), webhook or not.
  console.warn(`[dispute] ${headline} :: ${info.explanation.slice(0, 200)}`);

  const url = process.env.DISPUTE_WEBHOOK_URL;
  if (!url) return;

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `${headline}\n${info.explanation.slice(0, 500)}\nReview: /admin/disputes`,
      }),
      signal: AbortSignal.timeout(4000),
    });
  } catch (err) {
    // Never let alerting break the user's submission.
    console.error("[dispute] webhook delivery failed:", err instanceof Error ? err.message : err);
  }
}
