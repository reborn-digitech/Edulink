"use server";

import { revalidatePath } from "next/cache";
import { getT } from "@/lib/i18n/server";
import { requireApiUser, AccessError } from "@/lib/tenancy";
import {
  createSchool,
  updateSchool,
  inviteAdmin,
  revokeInvite,
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
