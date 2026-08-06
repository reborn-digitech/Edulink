"use server";

import { revalidatePath } from "next/cache";
import { getT } from "@/lib/i18n/server";
import { requireSuperuser, AccessError } from "@/lib/tenancy";
import { closeSchool, openSchool } from "@/lib/superuser";
import { setMembershipSuspension, takeDownPost, findPeople } from "@/lib/operator-oversight";
import type { OversightPerson } from "@/lib/operator-oversight";

type Result = { ok: boolean; error?: string };

async function failure(error: unknown): Promise<Result> {
  if (error instanceof AccessError)
      return { ok: false, error: (await getT())(error.key, error.vars) };
  console.error("[oversight]", error);
  return { ok: false, error: (await getT())("common.somethingWrong") };
}

/** Opens a school for a bounded time, having written down why. */
export async function open(schoolId: string, reason: string): Promise<Result> {
  try {
    const session = await requireSuperuser();
    const result = await openSchool(session, schoolId, reason);
    if (!result.ok) return { ok: false, error: (await getT())(result.errorKey) };
    revalidatePath(`/root/${schoolId}/inside`);
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function close(schoolId: string): Promise<Result> {
  try {
    const session = await requireSuperuser();
    await closeSchool(session, schoolId);
    revalidatePath(`/root/${schoolId}/inside`);
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function takeDown(
  schoolId: string,
  postId: string,
  reason: string,
): Promise<Result> {
  try {
    const session = await requireSuperuser();
    const result = await takeDownPost(session, schoolId, postId, reason);
    if (!result.ok) return { ok: false, error: (await getT())(result.errorKey) };
    revalidatePath(`/root/${schoolId}/inside`);
    // The school's own bulletin reads the same row.
    revalidatePath("/bulletin");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function search(schoolId: string, query: string): Promise<OversightPerson[]> {
  try {
    const session = await requireSuperuser();
    return await findPeople(session, schoolId, query);
  } catch {
    // An empty list rather than an error: the search box is not the place to
    // discover that a grant expired, and the page above says so already.
    return [];
  }
}

export async function setSuspension(
  schoolId: string,
  membershipId: string,
  next: { suspended: boolean; reason: string },
): Promise<Result> {
  try {
    const session = await requireSuperuser();
    const result = await setMembershipSuspension(session, schoolId, membershipId, next);
    if (!result.ok) return { ok: false, error: (await getT())(result.errorKey) };
    revalidatePath(`/root/${schoolId}/inside`);
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}
