"use server";

import { revalidatePath } from "next/cache";
import { getT } from "@/lib/i18n/server";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import {
  generateCards,
  publishCards,
  setRemark,
  withdrawCards,
  type GenerateInput,
} from "@/lib/report-cards";

/**
 * Building a term's report cards.
 *
 * ADMIN and PRINCIPAL are accepted alongside TEACHER because
 * `assertMayWriteCards` is what actually decides — it lets an admin through, and
 * the class's LEAD teacher whatever role they hold, and refuses everybody else
 * including a co-teacher. Repeating that list here would be a second place to
 * get it wrong; the roles named here are only the door, not the decision.
 */

type Result = {
  ok: boolean;
  error?: string;
  created?: number;
  updated?: number;
  skippedPublished?: number;
  published?: number;
  withdrawn?: number;
};

async function failure(error: unknown): Promise<Result> {
  if (error instanceof AccessError) return { ok: false, error: error.message };
  console.error("[report-cards]", error);
  return { ok: false, error: (await getT())("common.tryAgainMoment") };
}

/** The lib mints KEYS; this boundary turns them into the reader's words. */
async function translated<T extends { ok: boolean; errorKey?: string }>(
  result: T,
): Promise<Omit<T, "errorKey"> & { error?: string }> {
  const { errorKey, ...rest } = result;
  if (result.ok || !errorKey) return rest;
  const t = await getT();
  return { ...rest, error: t(errorKey as Parameters<typeof t>[0]) };
}

export async function generate(classId: string, input: GenerateInput): Promise<Result> {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN", "PRINCIPAL");
    const result = await translated(await generateCards(ctx, classId, input));
    revalidatePath(`/teacher/classes/${classId}/report-cards`);
    return result;
  } catch (error) {
    return failure(error);
  }
}

export async function saveRemark(classId: string, cardId: string, remark: string): Promise<Result> {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN", "PRINCIPAL");
    const result = await translated(await setRemark(ctx, cardId, remark));
    revalidatePath(`/teacher/classes/${classId}/report-cards`);
    return result;
  } catch (error) {
    return failure(error);
  }
}

export async function publish(classId: string, title: string): Promise<Result> {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN", "PRINCIPAL");
    const result = await translated(await publishCards(ctx, classId, title));
    revalidatePath(`/teacher/classes/${classId}/report-cards`);
    return result;
  } catch (error) {
    return failure(error);
  }
}

export async function withdraw(classId: string, title: string): Promise<Result> {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN", "PRINCIPAL");
    const result = await translated(await withdrawCards(ctx, classId, title));
    revalidatePath(`/teacher/classes/${classId}/report-cards`);
    return result;
  } catch (error) {
    return failure(error);
  }
}
