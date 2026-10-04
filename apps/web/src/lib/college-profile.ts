import "server-only";
import {
  GLOBAL_FEED_KIND_CHOICES,
  GLOBAL_FEED_KINDS_OF,
  INSTITUTION_KINDS,
  isCollegeKind,
  NAAC_GRADES,
  NIRF_CATEGORIES,
  parseStreams,
  type CollegeProfile,
  type CollegeProfileSet,
  type GlobalFeedKindChoice,
  type InstitutionKind,
} from "@edulink/contracts";
import { db } from "./db";
import { audit } from "./audit";
import { AccessError, NotACollegeError } from "./access-error";
import { readJsonArray } from "./json";
import type { ActiveContext } from "./session";
import { setStreams } from "./streams";

/**
 * A COLLEGE'S PROFILE AND THE FEED'S KIND FILTER (4 October 2026): the two
 * settings of the college foundation the office writes.
 *
 * THE PROFILE is the handful of regulator references a college is known by —
 * its affiliating university, AISHE code, AICTE and UGC approval references,
 * NAAC grade and its expiry, NIRF category — on School itself, null for a
 * school. The office (ADMIN) writes; the head reads; the IQAC and filings
 * builders read them from the row. Coded where a filing wants a code (NAAC
 * grade, NIRF category, the AISHE pattern), never free text there.
 *
 * THE KIND FILTER is School.globalFeedKinds: which kinds of institution this
 * tenant's people read on the global feed, chosen as "schools", "colleges"
 * or "both" on the feed settings page and stored as the kinds those stand
 * for (GLOBAL_FEED_KINDS_OF). global-feed.ts reads it.
 */

function assertOffice(ctx: ActiveContext, write: boolean): asserts ctx is ActiveContext & { schoolId: string } {
  if (!ctx.schoolId) throw new AccessError("access.noActiveSchoolSelected");
  if (ctx.role !== "ADMIN" && (write || ctx.role !== "PRINCIPAL")) throw new AccessError("access.wrongRoleForThisAction");
}

const dayKey = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);

export async function collegeProfile(ctx: ActiveContext): Promise<CollegeProfile> {
  assertOffice(ctx, false);
  const s = await db.school.findUniqueOrThrow({
    where: { id: ctx.schoolId },
    select: { kind: true, streamsJson: true, affiliatingUniversity: true, aisheCode: true, aicteApprovalRef: true, ugcApprovalRef: true, naacGrade: true, naacValidUntil: true, nirfCategory: true },
  });
  return {
    kind: s.kind as InstitutionKind,
    // The college's streams (5 Oct 2026); a school's list is empty.
    streams: isCollegeKind(s.kind) ? parseStreams(s.streamsJson) : [],
    affiliatingUniversity: s.affiliatingUniversity,
    aisheCode: s.aisheCode,
    aicteApprovalRef: s.aicteApprovalRef,
    ugcApprovalRef: s.ugcApprovalRef,
    naacGrade: (NAAC_GRADES as readonly string[]).includes(s.naacGrade ?? "") ? (s.naacGrade as CollegeProfile["naacGrade"]) : null,
    naacValidUntil: dayKey(s.naacValidUntil),
    nirfCategory: (NIRF_CATEGORIES as readonly string[]).includes(s.nirfCategory ?? "") ? (s.nirfCategory as CollegeProfile["nirfCategory"]) : null,
  };
}

/**
 * Write the profile: a key left out stays, null clears. A college's alone —
 * a school has no affiliating university to keep — and the office's alone.
 * Audited with the names of the fields that changed, never their values
 * (they are public references, but the log is for who changed what).
 */
export async function setCollegeProfile(ctx: ActiveContext, input: CollegeProfileSet): Promise<{ changed: string[] }> {
  assertOffice(ctx, true);
  if (input.naacGrade && !(NAAC_GRADES as readonly string[]).includes(input.naacGrade)) throw new AccessError("college.refuseNaacGrade");
  if (input.nirfCategory && !(NIRF_CATEGORIES as readonly string[]).includes(input.nirfCategory)) throw new AccessError("college.refuseNirfCategory");
  const text = (v: string | null | undefined) => (v === undefined ? undefined : v === null || v.trim() === "" ? null : v.trim());
  const data = {
    affiliatingUniversity: text(input.affiliatingUniversity),
    aisheCode: text(input.aisheCode),
    aicteApprovalRef: text(input.aicteApprovalRef),
    ugcApprovalRef: text(input.ugcApprovalRef),
    naacGrade: input.naacGrade,
    naacValidUntil: input.naacValidUntil === undefined ? undefined : input.naacValidUntil === null ? null : new Date(`${input.naacValidUntil}T00:00:00Z`),
    nirfCategory: input.nirfCategory,
  };
  const changed = Object.entries(data).filter(([, v]) => v !== undefined).map(([k]) => k);
  if (changed.length === 0 && input.streams === undefined) return { changed };
  const school = await db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { kind: true } });
  if (!isCollegeKind(school.kind)) throw new NotACollegeError("college.refuseNotACollege");
  // The streams (5 Oct 2026) first, with their own refusal and audit row (college.streams.set): a list
  // that cannot stand leaves the references unwritten too.
  if (input.streams !== undefined && (await setStreams(ctx, input.streams)).changed) changed.push("streams");
  const references = changed.filter((k) => k !== "streams");
  if (references.length === 0) return { changed };
  await db.school.update({ where: { id: ctx.schoolId }, data });
  await audit({ schoolId: ctx.schoolId, actorUserId: ctx.user.id, action: "college.profile.update", targetType: "School", targetId: ctx.schoolId, meta: { fields: references } });
  return { changed };
}

/** Which of the three words a stored set of kinds is; anything else reads as "both". */
export function feedKindChoiceOf(raw: string): GlobalFeedKindChoice {
  const kinds = new Set(readJsonArray<string>(raw));
  for (const choice of GLOBAL_FEED_KIND_CHOICES) {
    const of = GLOBAL_FEED_KINDS_OF[choice];
    if (of.length === kinds.size && of.every((k) => kinds.has(k))) return choice;
  }
  return "BOTH";
}

export async function globalFeedKinds(ctx: ActiveContext): Promise<{ choice: GlobalFeedKindChoice }> {
  assertOffice(ctx, false);
  const s = await db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { globalFeedKinds: true } });
  return { choice: feedKindChoiceOf(s.globalFeedKinds) };
}

/** The admin chooses schools, colleges or both; idempotent, and audited when it changes. */
export async function setGlobalFeedKinds(ctx: ActiveContext, choice: GlobalFeedKindChoice): Promise<{ choice: GlobalFeedKindChoice; changed: boolean }> {
  assertOffice(ctx, true);
  if (!(GLOBAL_FEED_KIND_CHOICES as readonly string[]).includes(choice)) throw new AccessError("college.refuseFeedKinds");
  const current = await globalFeedKinds(ctx);
  if (current.choice === choice) return { choice, changed: false };
  const kinds = INSTITUTION_KINDS.filter((k) => GLOBAL_FEED_KINDS_OF[choice].includes(k));
  await db.school.update({ where: { id: ctx.schoolId }, data: { globalFeedKinds: JSON.stringify(kinds) } });
  await audit({ schoolId: ctx.schoolId, actorUserId: ctx.user.id, action: "feed.global.kinds", targetType: "School", targetId: ctx.schoolId, meta: { from: current.choice, to: choice } });
  return { choice, changed: true };
}
