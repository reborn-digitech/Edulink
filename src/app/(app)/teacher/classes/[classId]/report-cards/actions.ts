"use server";

import { revalidatePath } from "next/cache";
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
 * ADMIN is accepted alongside TEACHER because `assertMayWriteCards` is what
 * actually decides — it lets the class's LEAD teacher through, and an admin, and
 * refuses everybody else including a co-teacher and the principal. Repeating
 * that list here would be a second place to get it wrong.
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

function failure(error: unknown): Result {
  if (error instanceof AccessError) return { ok: false, error: error.message };
  console.error("[report-cards]", error);
  return { ok: false, error: "Something went wrong. Try again in a moment." };
}

export async function generate(classId: string, input: GenerateInput): Promise<Result> {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN");
    const result = await generateCards(ctx, classId, input);
    revalidatePath(`/teacher/classes/${classId}/report-cards`);
    return result;
  } catch (error) {
    return failure(error);
  }
}

export async function saveRemark(classId: string, cardId: string, remark: string): Promise<Result> {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN");
    const result = await setRemark(ctx, cardId, remark);
    revalidatePath(`/teacher/classes/${classId}/report-cards`);
    return result;
  } catch (error) {
    return failure(error);
  }
}

export async function publish(classId: string, title: string): Promise<Result> {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN");
    const result = await publishCards(ctx, classId, title);
    revalidatePath(`/teacher/classes/${classId}/report-cards`);
    return result;
  } catch (error) {
    return failure(error);
  }
}

export async function withdraw(classId: string, title: string): Promise<Result> {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN");
    const result = await withdrawCards(ctx, classId, title);
    revalidatePath(`/teacher/classes/${classId}/report-cards`);
    return result;
  } catch (error) {
    return failure(error);
  }
}
