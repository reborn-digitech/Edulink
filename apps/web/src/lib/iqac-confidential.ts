import "server-only";
import { db } from "./db";

/**
 * THE TWO CONFIDENTIAL COMMITTEES (G4-16; the owner's decision on TA-304 of 14 November 2026). Ragging and
 * harassment are read by the office and the head alone: a grievance's words (iqac.ts `grievanceDesk`) and,
 * since TA-304, the action-taken text and the minutes file of an ICC or anti-ragging committee's meeting. The
 * IQAC sees that such a meeting was held and its date, never more: `listCommittees` leaves the text and the
 * file out for it, the file rule (files.ts) refuses it the minutes, and the minutes are never listed or
 * attached as evidence (the evidence list, a qualitative score, the entered figures, a peer visit's lines).
 */
export const CONFIDENTIAL_COMMITTEES: ReadonlySet<string> = new Set(["ANTI_RAGGING", "ICC"]);

/** Of `fileIds` (every file when left out), those that are the minutes of a confidential committee's meeting at this college. */
export async function confidentialMinutes(schoolId: string, fileIds?: string[]): Promise<Set<string>> {
  if (fileIds && fileIds.length === 0) return new Set();
  const rows = await db.committeeMeeting.findMany({
    where: { schoolId, minutesFileId: fileIds ? { in: fileIds } : { not: null }, committee: { kind: { in: [...CONFIDENTIAL_COMMITTEES] } } },
    select: { minutesFileId: true },
  });
  return new Set(rows.map((r) => r.minutesFileId).filter((x): x is string => !!x));
}
