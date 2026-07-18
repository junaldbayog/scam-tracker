export type CommentCheck = {
  cleaned: string;
  // approve: publish now; pending: hold for review; reject: refuse outright
  action: "approve" | "pending" | "reject";
  reasons: string[];
};

const URL_RE = /(https?:\/\/|www\.)\S+/i;
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.]+/g;

/**
 * Screen a comment before storing. Comments publish immediately — there is no
 * pre-publish moderation queue for normal posts. Two guards remain:
 *   - hard rejects for too-short / too-long input (basic validation)
 *   - links are held for review, because a live clickable URL on an anti-scam
 *     site is a phishing vector; everything else posts right away.
 * Emails are stripped for privacy regardless. Abusive content is handled
 * reactively by an admin removing the published comment.
 */
export function checkComment(body: string): CommentCheck {
  const reasons: string[] = [];
  let cleaned = body.trim().replace(/\s+/g, " ");

  if (cleaned.length < 10) return { cleaned, action: "reject", reasons: ["too_short"] };
  if (cleaned.length > 2000) return { cleaned, action: "reject", reasons: ["too_long"] };

  // Strip emails (privacy) rather than rejecting.
  if (EMAIL_RE.test(cleaned)) {
    cleaned = cleaned.replace(EMAIL_RE, "[removed]");
    reasons.push("email_removed");
  }

  // Anti-phishing: hold link-bearing comments; publish everything else now.
  if (URL_RE.test(cleaned)) {
    reasons.push("contains_link");
    return { cleaned, action: "pending", reasons };
  }

  return { cleaned, action: "approve", reasons };
}

export function checkDisplayName(name: string): string {
  const cleaned = name.trim().slice(0, 40).replace(/[<>]/g, "");
  return cleaned || "Anonymous";
}
