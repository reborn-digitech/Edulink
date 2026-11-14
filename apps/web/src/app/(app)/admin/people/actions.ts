"use server";

import { recordOrScheduleLeaving } from "@/lib/leaving";
import { recordStaffLeaving } from "@/lib/staff-leaving";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { revalidatePath } from "next/cache";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import {
  suspendMembership,
  reinstateMembership,
  removeMembership,
  type RemovalBlocker,
} from "@/lib/membership";
import { setTeacherSubjects } from "@/lib/reviews";
import { inviteParent } from "@/lib/parent-link";
import { endFamilyGuardianship, familyGuardiansOf } from "@/lib/guardianship";
import { issueFirstSignIn } from "@/lib/first-signin";
import { setStaffRecord, type StaffRecordInput } from "@/lib/staff-records";
import { cancelScheduledDeparture, undoDeparture } from "@/lib/school-record";
import { setMemberBirthdate } from "@/lib/birthdate";
import { correctLegalName } from "@/lib/legal-name";
import { setDuties } from "@/lib/duties";
import { RuleRefusal } from "@/lib/rule-refusal";
import type { GuardianRelation } from "@/lib/constants";

/**
 * Pausing and restoring access, from the directory.
 *
 * The role is re-read from the SESSION on every call rather than passed in, and
 * the membership id travels in the request — so it is re-scoped to the admin's
 * own school inside `membership.ts`. A guessed id belonging to another school is
 * "not in this school", not somebody else's teacher.
 */

/**
 * ⚠ `errorKey` AND `error`, and the split is honest rather than untidy.
 *
 * `errorKey` is everything this file decides itself, returned as a key so the
 * form resolves it in the reader's language. `error` is the one case it cannot:
 * an `AccessError` from the tenancy layer, whose message is minted app-wide.
 */
type Result = { ok: boolean; error?: string;
  errorKey?: TranslationKey;
  errorVars?: Record<string, string | number>;
};

function failure(error: unknown): Result {
  if (error instanceof AccessError) return { ok: false, errorKey: error.key, errorVars: error.vars };
  console.error("[people]", error);
  return { ok: false, errorKey: "common.tryAgainMoment" };
}

export async function suspend(membershipId: string, reason: string): Promise<Result> {
  try {
    const ctx = await requireApiRole("ADMIN");
    const result = await suspendMembership(ctx, membershipId, reason);
    if (!result.ok) return { ok: false, errorKey: result.errorKey };
    revalidatePath("/admin/people");
    revalidatePath("/admin/safety");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function reinstate(membershipId: string): Promise<Result> {
  try {
    const ctx = await requireApiRole("ADMIN");
    const result = await reinstateMembership(ctx, membershipId);
    if (!result.ok) return { ok: false, errorKey: result.errorKey };
    revalidatePath("/admin/people");
    revalidatePath("/admin/safety");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

/**
 * Recording a pupil as having left, and undoing it.
 *
 * SEPARATE ACTIONS FROM `suspend`, because they are separate facts — see
 * `school-record.ts`. Pausing says "not for now"; this says "they have gone to
 * another school", and a directory that cannot tell them apart cannot answer
 * the only question a school asks in September.
 */
export async function recordLeaving(
  membershipId: string,
  input: { reason: string; destination: string; note: string; leftOn: string; conduct?: string },
): Promise<Result & { recordId?: string; scheduledFor?: string }> {
  try {
    const ctx = await requireApiRole("ADMIN");
    // Today or a later day, recorded or kept: the rule is lib/leaving.ts, which the phone's endpoint calls too.
    const result = await recordOrScheduleLeaving(ctx, membershipId, input);
    if (!result.ok) return { ok: false, errorKey: result.errorKey };
    revalidatePath("/admin/people");
    return { ok: true, ...(result.recordId ? { recordId: result.recordId } : {}), ...(result.scheduledFor ? { scheduledFor: result.scheduledFor } : {}) };
  } catch (error) {
    return failure(error);
  }
}

/** TA-046: a member of staff's last working day with a coded reason; recorded now when past, kept otherwise. The rule is lib/staff-leaving.ts, which the phone's endpoint calls too. */
export async function recordStaffLeavingAction(membershipId: string, input: { lastDay: string; reason: string }): Promise<Result & { scheduledFor?: string }> {
  try {
    const ctx = await requireApiRole("ADMIN");
    const result = await recordStaffLeaving(ctx, membershipId, input);
    if (!result.ok) return { ok: false, errorKey: result.errorKey };
    revalidatePath("/admin/people");
    revalidatePath("/admin/payroll");
    return { ok: true, ...(result.scheduledFor ? { scheduledFor: result.scheduledFor } : {}) };
  } catch (error) {
    return failure(error);
  }
}

export async function undoLeaving(membershipId: string): Promise<Result> {
  try {
    const ctx = await requireApiRole("ADMIN");
    const result = await undoDeparture(ctx, membershipId);
    if (!result.ok) return { ok: false, errorKey: result.errorKey };
    revalidatePath("/admin/people");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

/**
 * Removing a pupil who was added by mistake.
 *
 * THE THIRD VERB — see `removeMembership` for why there are three rather than
 * two. This is the only action in the app that deletes a row, and the guard is
 * in the library rather than here: it refuses the moment there is anything a
 * school would have to certify, so the destructive path is not reachable for
 * anybody who actually attended.
 *
 * The blockers come back so the UI can say WHICH record is in the way, rather
 * than "cannot remove" and leaving an admin to guess.
 */
export async function removePerson(membershipId: string): Promise<RemovalActionResult> {
  try {
    const ctx = await requireApiRole("ADMIN");
    const result = await removeMembership(ctx, membershipId);
    if (!result.ok) return { ok: false, errorKey: result.errorKey, blockers: result.blockers };
    revalidatePath("/admin/people");
    revalidatePath("/admin/classes");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export type RemovalActionResult = Result & { blockers?: RemovalBlocker };

/**
 * Replace a teacher's subject list — the office's half of what the teacher
 * chose at signup. Feeds the directory line, the teacher's profile, and the
 * subject-aware cover suggestions on leave.
 */
export async function setSubjects(membershipId: string, subjects: string[]): Promise<Result> {
  try {
    const ctx = await requireApiRole("ADMIN");
    const result = await setTeacherSubjects(ctx, membershipId, subjects);
    if (!result.ok) return { ok: false, errorKey: result.errorKey };
    revalidatePath("/admin/people");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

/**
 * The office links a parent: an invitation to the address it has, which
 * creates the guardianship when — and only when — that person accepts.
 */
export async function inviteParentAction(
  studentMembershipId: string,
  input: { email: string; name: string; relation: string },
): Promise<Result> {
  try {
    const ctx = await requireApiRole("ADMIN");
    const result = await inviteParent(ctx, studentMembershipId, {
      email: input.email,
      name: input.name,
      relation: input.relation as GuardianRelation,
    });
    if (!result.ok) return { ok: false, errorKey: result.errorKey };
    revalidatePath("/admin/people");
    revalidatePath("/admin/invites");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

/** A pupil's family guardians on the app (TA-177), for the office's Family links panel; never the school's stand-in. */
export type FamilyLinksResult = Result & { guardians?: { guardianshipId: string; name: string; relation: GuardianRelation; since: string }[] };

export async function familyLinksAction(studentMembershipId: string): Promise<FamilyLinksResult> {
  try {
    const ctx = await requireApiRole("ADMIN");
    const rows = await familyGuardiansOf(ctx, studentMembershipId);
    return { ok: true, guardians: rows.map((g) => ({ ...g, since: g.since.toISOString() })) };
  } catch (error) {
    return failure(error);
  }
}

/**
 * The office ends a family guardian's link for a coded reason (TA-177): the rule, the audit row, who is told and the
 * school's stand-in are lib/guardianship.ts.
 */
export async function endFamilyLinkAction(studentMembershipId: string, guardianshipId: string, reason: string): Promise<Result & { schoolStandsIn?: boolean }> {
  try {
    const ctx = await requireApiRole("ADMIN");
    const result = await endFamilyGuardianship(ctx, studentMembershipId, guardianshipId, reason);
    if (!result.ok) return { ok: false, errorKey: result.errorKey };
    revalidatePath("/admin/people");
    revalidatePath("/admin/safety");
    return { ok: true, schoolStandsIn: result.schoolStandsIn };
  } catch (error) {
    return failure(error);
  }
}

/** The office sets or clears a member's date of birth — audited, and told. */
export async function setBirthdateAction(membershipId: string, dateKey: string): Promise<Result> {
  try {
    const ctx = await requireApiRole("ADMIN");
    const result = await setMemberBirthdate(ctx, membershipId, dateKey.trim() === "" ? null : dateKey);
    if (!result.ok) return { ok: false, errorKey: result.errorKey };
    revalidatePath("/admin/people");
    revalidatePath("/admin/calendar");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

/** The office corrects a legal name, with a coded reason — audited, and told. Papers already out keep theirs. */
export async function correctLegalNameAction(membershipId: string, name: string, reason: string): Promise<Result> {
  try {
    const ctx = await requireApiRole("ADMIN");
    const result = await correctLegalName(ctx, membershipId, name, reason);
    if (!result.ok) return { ok: false, errorKey: result.errorKey };
    revalidatePath("/admin/people");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

/** A pupil's first sign-in code, for the slip that goes home. Shown once. */
export async function issueFirstSignInAction(
  studentMembershipId: string,
): Promise<{ ok: true; issued: { code: string; handle: string; expiresAt: string } } | (Result & { ok: false })> {
  try {
    const ctx = await requireApiRole("ADMIN");
    const result = await issueFirstSignIn(ctx, studentMembershipId);
    if (!result.ok) return { ok: false, errorKey: result.errorKey };
    return { ok: true, issued: { ...result.issued, expiresAt: result.issued.expiresAt.toISOString() } };
  } catch (error) {
    return failure(error) as Result & { ok: false };
  }
}

export async function setStaffRecordAction(membershipId: string, input: StaffRecordInput): Promise<Result> {
  try {
    const ctx = await requireApiRole("ADMIN");
    const result = await setStaffRecord(ctx, membershipId, input);
    if (!result.ok) return { ok: false, errorKey: result.errorKey };
    revalidatePath("/admin/people");
    revalidatePath("/teacher/profile");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function cancelLeavingAction(membershipId: string): Promise<Result> {
  try {
    const ctx = await requireApiRole("ADMIN");
    const result = await cancelScheduledDeparture(ctx, membershipId);
    if (!result.ok) return { ok: false, errorKey: result.errorKey };
    revalidatePath("/admin/people");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

/**
 * A college teacher's duties (5 Oct 2026): the registrar's, from the row's
 * menu — the whole list, each one the college's streams offer. Audited
 * people.duties.set by the library.
 */
export async function setDutiesAction(membershipId: string, duties: string[]): Promise<Result> {
  try {
    const ctx = await requireApiRole("ADMIN");
    await setDuties(ctx, membershipId, duties);
    revalidatePath("/admin/people");
    return { ok: true };
  } catch (error) {
    if (error instanceof RuleRefusal) return { ok: false, errorKey: error.key, errorVars: error.vars };
    return failure(error);
  }
}
