"use server";

import type { TranslationKey } from "@/lib/i18n/dictionary";
import { revalidatePath } from "next/cache";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import {
  suspendMembership,
  reinstateMembership,
  removeMembership,
  type RemovalBlocker,
} from "@/lib/membership";
import {
  recordDeparture,
  undoDeparture,
  type DepartureInput,
} from "@/lib/school-record";

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
  if (error instanceof AccessError) return { ok: false, error: error.message };
  console.error("[people]", error);
  return { ok: false, errorKey: "common.tryAgainMoment" };
}

export async function suspend(membershipId: string, reason: string): Promise<Result> {
  try {
    const ctx = await requireApiRole("ADMIN");
    const result = await suspendMembership(ctx, membershipId, reason);
    if (!result.ok) return { ok: false, error: result.error };
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
    if (!result.ok) return { ok: false, error: result.error };
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
  input: { reason: string; destination: string; note: string; leftOn: string },
): Promise<Result & { recordId?: string }> {
  try {
    const ctx = await requireApiRole("ADMIN");
    const result = await recordDeparture(ctx, membershipId, {
      reason: input.reason as DepartureInput["reason"],
      destination: input.destination,
      note: input.note,
      // An empty date box means today, which is what it means on paper. A
      // typed-in date that is not a date is refused by the library rather than
      // silently becoming today — a certificate is dated, and the wrong date is
      // worse than being asked again.
      leftOn: input.leftOn ? new Date(input.leftOn) : undefined,
    });
    if (!result.ok) return { ok: false, error: result.error };
    revalidatePath("/admin/people");
    return { ok: true, recordId: result.recordId };
  } catch (error) {
    return failure(error);
  }
}

export async function undoLeaving(membershipId: string): Promise<Result> {
  try {
    const ctx = await requireApiRole("ADMIN");
    const result = await undoDeparture(ctx, membershipId);
    if (!result.ok) return { ok: false, error: result.error };
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
    if (!result.ok) return { ok: false, error: result.error, blockers: result.blockers };
    revalidatePath("/admin/people");
    revalidatePath("/admin/classes");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export type RemovalActionResult = Result & { blockers?: RemovalBlocker };
