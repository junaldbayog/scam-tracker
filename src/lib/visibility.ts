import type { Prisma } from "@/generated/prisma/client";

/**
 * Search-indexability gate for number pages.
 *
 * Policy (chosen for maximum protective reach): a number page is indexable as
 * soon as it has any real content — at least INDEX_MIN_REPORTS approved report,
 * or a `seedSource` (an official public advisory or human-reviewed curation).
 * Only empty (0-report, no-source) or non-ACTIVE numbers stay out of Google.
 *
 * Note the trade-off: at a threshold of 1, a single anonymous report is enough
 * to put an accusation about a real number into Google, so abuse/defamation is
 * handled reactively via the dispute → DELIST takedown flow rather than by
 * withholding indexing. Raise INDEX_MIN_REPORTS if that balance needs to shift.
 *
 * Either way the page still exists and works below the bar — noindex only keeps
 * it out of Google's results, not off the site. This module is the single
 * source of truth so the page metadata and the sitemap never drift.
 */
export const INDEX_MIN_REPORTS = 1;

type IndexableInput = {
  status: string;
  seedSource: string | null;
  reportCount: number;
};

/** Per-record check, used by number-page metadata (robots noindex). */
export function isIndexable(n: IndexableInput): boolean {
  if (n.status !== "ACTIVE") return false;
  return n.seedSource !== null || n.reportCount >= INDEX_MIN_REPORTS;
}

/** Equivalent Prisma filter, used by the sitemap + its chunk count. */
export const indexableWhere: Prisma.PhoneNumberWhereInput = {
  status: "ACTIVE",
  OR: [{ seedSource: { not: null } }, { reportCount: { gte: INDEX_MIN_REPORTS } }],
};
