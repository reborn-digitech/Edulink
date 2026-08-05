import type { TranslationKey } from "./i18n/dictionary";

/**
 * The vocabulary of staff leave, minus anything that touches a database.
 *
 * ITS OWN FILE, and deliberately free of `server-only` — the same split as the
 * locale list, made for the same reason and discovered the same way. The apply
 * form and the decision card are client components, they need the list of leave
 * kinds and their labels, and importing those from `leave.ts` drags
 * `server-only` into the browser bundle and fails the build.
 *
 * `leave.ts` re-exports all of it, so server code carries on importing from
 * `@/lib/leave` and nothing else had to learn about this split.
 */

export const LEAVE_KINDS = ["CASUAL", "SICK", "UNPAID", "OTHER"] as const;
export type LeaveKind = (typeof LEAVE_KINDS)[number];

/**
 * ⚠ KEYS, NOT WORDS — see `ROLE_META`. This table is read by three different
 * roles on three different pages, and it was English on all of them: a Hindi
 * teacher's own leave form offered "Casual leave" beside fully translated
 * labels, and had done since the teacher surface was translated.
 */
export const LEAVE_KIND_LABEL_KEY: Record<LeaveKind, TranslationKey> = {
  CASUAL: "leaveKind.casual",
  SICK: "leaveKind.sick",
  UNPAID: "leaveKind.unpaid",
  OTHER: "leaveKind.other",
};

export const LEAVE_STATUSES = ["PENDING", "APPROVED", "DECLINED", "CANCELLED"] as const;
export type LeaveStatus = (typeof LEAVE_STATUSES)[number];

/** One request, as every screen renders it. */
export type LeaveRow = {
  id: string;
  status: string;
  kind: string;
  fromDateKey: string;
  toDateKey: string;
  reason: string;
  decisionNote: string | null;
  applicantName: string;
  applicantMembershipId: string;
  nominatedName: string | null;
  decidedByName: string | null;
  decidedAt: Date | null;
};
