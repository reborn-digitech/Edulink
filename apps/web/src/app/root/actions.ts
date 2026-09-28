"use server";

import { revalidatePath } from "next/cache";
import { getT } from "@/lib/i18n/server";
import { requireApiUser, AccessError } from "@/lib/tenancy";
import {
  createSchool,
  updateSchool,
  removeSchools, deleteSchoolsEntirely, removeSchool,
  restoreSchool,
  setSchoolVerified,
  deleteSchoolEntirely,
  inviteAdmin,
  revokeInvite,
  appointAppAdmin,
  dismissAppAdmin,
  assertSuperuser,
  type SchoolDetails,
} from "@/lib/superuser";

/**
 * Operator actions.
 *
 * Every one re-reads the session and re-asserts the flag. The `/root` layout
 * already gates the pages, but a server action is its own entry point — it is
 * reachable by anybody who can POST, layout or no layout, and a gate that only
 * exists in a layout is a gate on the furniture.
 */

type Result = { ok: boolean; error?: string; schoolId?: string; code?: string };

async function failure(error: unknown): Promise<Result> {
  if (error instanceof AccessError)
      return { ok: false, error: (await getT())(error.key, error.vars) };
  console.error("[root]", error);
  return { ok: false, error: (await getT())("common.tryAgainMoment") };
}

export async function createSchoolAction(details: SchoolDetails): Promise<Result> {
  try {
    const session = await requireApiUser();
    assertSuperuser(session);
    const result = await createSchool(session, details);
    // The lib mints a KEY; this boundary turns it into the reader's words.
    if (!result.ok) return { ok: false, error: (await getT())(result.errorKey) };
    revalidatePath("/root");
    return { ok: true, schoolId: result.schoolId, code: result.code };
  } catch (error) {
    return failure(error);
  }
}

export async function updateSchoolAction(
  schoolId: string,
  details: Partial<SchoolDetails>,
): Promise<Result> {
  try {
    const session = await requireApiUser();
    assertSuperuser(session);
    const result = await updateSchool(session, schoolId, details);
    if (!result.ok && result.errorKey) return { ok: false, error: (await getT())(result.errorKey) };
    revalidatePath("/root");
    revalidatePath(`/root/${schoolId}`);
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

/**
 * Removes a school. The lib turns the whole roll into leavers first — every
 * pupil keeps their account and gets a certificate — and only then flags the
 * school; see removeSchool for why that order.
 */
export async function removeSchoolAction(schoolId: string): Promise<Result> {
  try {
    const session = await requireApiUser();
    assertSuperuser(session);
    const result = await removeSchool(session, schoolId);
    if (!result.ok && result.errorKey) return { ok: false, error: (await getT())(result.errorKey) };
    revalidatePath("/root");
    revalidatePath(`/root/${schoolId}`);
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

/**
 * Erases a school for good. The typed name travels with the request and is
 * checked in the lib, not only in the dialog — a POST is its own entry point.
 */
export async function deleteSchoolAction(schoolId: string, confirmName: string): Promise<Result> {
  try {
    const session = await requireApiUser();
    assertSuperuser(session);
    const result = await deleteSchoolEntirely(session, schoolId, confirmName);
    if (!result.ok && result.errorKey) return { ok: false, error: (await getT())(result.errorKey) };
    revalidatePath("/root");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export type BulkResult = { ok: boolean; done: number; failed: string[]; error?: string };

/** Removes several schools at once: each through the single door, reported per school. */
export async function removeSchoolsAction(schoolIds: string[]): Promise<BulkResult> {
  try {
    const session = await requireApiUser();
    assertSuperuser(session);
    const t = await getT();
    const outcome = await removeSchools(session, schoolIds);
    revalidatePath("/root");
    return { ok: outcome.failed.length === 0, done: outcome.done, failed: outcome.failed.map((f) => `${f.name ?? f.id}: ${t(f.errorKey)}`) };
  } catch (error) {
    return { ...(await failure(error)), done: 0, failed: [] };
  }
}

/** Erases several schools for good, behind the typed "DELETE n" the lib checks. */
export async function deleteSchoolsAction(schoolIds: string[], confirmPhrase: string): Promise<BulkResult> {
  try {
    const session = await requireApiUser();
    assertSuperuser(session);
    const t = await getT();
    const outcome = await deleteSchoolsEntirely(session, schoolIds, confirmPhrase);
    if (!outcome.ok && outcome.errorKey && outcome.done === 0 && outcome.failed.length === 0) {
      return { ok: false, done: 0, failed: [], error: t(outcome.errorKey) };
    }
    revalidatePath("/root");
    return { ok: outcome.ok, done: outcome.done, failed: outcome.failed.map((f) => `${f.name ?? f.id}: ${t(f.errorKey)}`) };
  } catch (error) {
    return { ...(await failure(error)), done: 0, failed: [] };
  }
}

/** Puts a removed school back — the lib revives exactly what removal ended. */
export async function restoreSchoolAction(schoolId: string): Promise<Result> {
  try {
    const session = await requireApiUser();
    assertSuperuser(session);
    const result = await restoreSchool(session, schoolId);
    if (!result.ok && result.errorKey) return { ok: false, error: (await getT())(result.errorKey) };
    revalidatePath("/root");
    revalidatePath(`/root/${schoolId}`);
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

/**
 * Gives or withdraws the operator's mark that a school has been checked —
 * what lets it bring over a pupil who already has an account elsewhere.
 */
export async function setSchoolVerifiedAction(schoolId: string, verified: boolean): Promise<Result> {
  try {
    const session = await requireApiUser();
    assertSuperuser(session);
    const result = await setSchoolVerified(session, schoolId, verified === true);
    if (!result.ok && result.errorKey) return { ok: false, error: (await getT())(result.errorKey) };
    revalidatePath("/root");
    revalidatePath(`/root/${schoolId}`);
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function inviteAdminAction(
  schoolId: string,
  input: { email: string; name?: string; role?: "ADMIN" | "PRINCIPAL" },
): Promise<Result> {
  try {
    const session = await requireApiUser();
    assertSuperuser(session);
    const result = await inviteAdmin(session, schoolId, input);
    if (!result.ok && result.errorKey) return { ok: false, error: (await getT())(result.errorKey) };
    revalidatePath(`/root/${schoolId}`);
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function revokeInviteAction(schoolId: string, inviteId: string): Promise<Result> {
  try {
    const session = await requireApiUser();
    assertSuperuser(session);
    const result = await revokeInvite(session, inviteId);
    if (!result.ok && result.errorKey) return { ok: false, error: (await getT())(result.errorKey) };
    revalidatePath(`/root/${schoolId}`);
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function appointAppAdminAction(email: string): Promise<Result> {
  try {
    const session = await requireApiUser();
    assertSuperuser(session);
    const result = await appointAppAdmin(session, email);
    if (!result.ok && result.errorKey) return { ok: false, error: (await getT())(result.errorKey) };
    revalidatePath("/root/content-team");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function dismissAppAdminAction(userId: string): Promise<Result> {
  try {
    const session = await requireApiUser();
    assertSuperuser(session);
    const result = await dismissAppAdmin(session, userId);
    if (!result.ok && result.errorKey) return { ok: false, error: (await getT())(result.errorKey) };
    revalidatePath("/root/content-team");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}
