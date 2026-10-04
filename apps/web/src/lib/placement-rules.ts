import type { DriveApplicationView, EligibilityFail, EligibilityRule, PlacementRecord } from "@edulink/contracts";

/**
 * The placement module's rules with no data layer (4 October 2026): what a
 * library function, a script and a test all compute the same way.
 */

/** The batch whose season runs now: the year of passing, which turns over in June. */
export function seasonBatchFor(today: string): number {
  const [y, m] = today.split("-").map(Number) as [number, number];
  return m >= 6 ? y + 1 : y;
}

/**
 * Every condition a student fails for a drive, each named — empty when they
 * qualify. Pure: the record, the profile and the accepted offer are read by
 * the caller. Unknown is not a pass: a CGPA floor with no published result
 * is CGPA_UNKNOWN, a backlog rule with no exam rows BACKLOGS_UNKNOWN.
 */
export function evaluateEligibility(input: {
  rule: EligibilityRule;
  record: PlacementRecord;
  optedOut: boolean;
  dreamFlag: boolean;
  /** The best accepted offer's package, when the student holds one. */
  acceptedRupees: number | null;
  drivePackageMaxRupees: number;
  dreamRatio: number;
  allowGenderRule: boolean;
}): EligibilityFail[] {
  const { rule, record } = input;
  const failed: EligibilityFail[] = [];
  const fail = (code: EligibilityFail["code"], need: string | number | null = null, have: string | number | null = null) => failed.push({ code, need: need === null ? null : String(need), have: have === null ? null : String(have) });
  if (input.optedOut) fail("OPTED_OUT");
  if (rule.cgpaMin !== null) {
    if (record.cgpa === null) fail("CGPA_UNKNOWN", rule.cgpaMin.toFixed(2));
    else if (record.cgpa + 1e-9 < rule.cgpaMin) fail("CGPA", rule.cgpaMin.toFixed(2), record.cgpa.toFixed(2));
  }
  if (rule.noLiveBacklogs) {
    if (record.liveBacklogs === null) fail("BACKLOGS_UNKNOWN", 0);
    else if (record.liveBacklogs > 0) fail("BACKLOGS", 0, record.liveBacklogs);
  }
  if (rule.programmeIds.length > 0 && (!record.programmeId || !rule.programmeIds.includes(record.programmeId))) fail("PROGRAMME", null, record.programmeName);
  if (rule.batchYear !== null && record.batchYear !== rule.batchYear) fail("BATCH", rule.batchYear, record.batchYear);
  if (input.allowGenderRule && rule.genders.length > 0 && (!record.gender || !rule.genders.includes(record.gender))) fail("GENDER", rule.genders.join("/"), record.gender);
  if (input.acceptedRupees !== null) {
    const floor = Math.ceil(input.acceptedRupees * input.dreamRatio);
    if (!input.dreamFlag || input.drivePackageMaxRupees < floor) fail("PLACED", floor, input.drivePackageMaxRupees);
  }
  return failed;
}

export function applicationStatus(app: { withdrawnAt: Date | null }, results: readonly { round: number; outcome: string }[], hasOffer: boolean): { status: DriveApplicationView["status"]; round: number | null } {
  if (app.withdrawnAt) return { status: "WITHDRAWN", round: null };
  if (hasOffer) return { status: "SELECTED", round: null };
  if (results.some((r) => r.outcome === "REJECTED" || r.outcome === "ABSENT")) return { status: "REJECTED", round: null };
  const passed = results.filter((r) => r.outcome === "PASSED").map((r) => r.round);
  if (passed.length === 0) return { status: "APPLIED", round: null };
  const top = Math.max(...passed);
  return top === 0 ? { status: "SHORTLISTED", round: null } : { status: "ROUND", round: top + 1 };
}

/** The middle value (the mean of the two middle ones for an even count, rounded); null for none. */
export function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : Math.round((s[mid - 1]! + s[mid]!) / 2);
}
