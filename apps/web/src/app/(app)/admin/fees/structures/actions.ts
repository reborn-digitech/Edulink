"use server";

import { revalidatePath } from "next/cache";
import { requireApiRole } from "@/lib/tenancy";
import { archiveStructure, assignPlans, createStructure, publishStructure, setStructureSelfEnrol, updateStructure, type AssignResult, type StructureInput } from "@/lib/fees";
import { failure, type ActionResult } from "../action-result";

function refresh(structureId?: string) {
  revalidatePath("/admin/fees");
  revalidatePath("/admin/fees/structures");
  revalidatePath("/admin/fees/dues");
  if (structureId) revalidatePath(`/admin/fees/structures/${structureId}`);
}

/** A draft in, an id out: create when there is no id, rewrite the draft otherwise. */
export async function saveStructureAction(structureId: string | null, input: StructureInput): Promise<ActionResult & { id?: string }> {
  try {
    const ctx = await requireApiRole("ADMIN", "ACCOUNTS");
    if (structureId) {
      await updateStructure(ctx, structureId, input);
      refresh(structureId);
      return { ok: true, id: structureId };
    }
    const id = await createStructure(ctx, input);
    refresh(id);
    return { ok: true, id };
  } catch (error) {
    return failure(error);
  }
}

export async function publishStructureAction(structureId: string): Promise<ActionResult> {
  try {
    const ctx = await requireApiRole("ADMIN", "ACCOUNTS");
    await publishStructure(ctx, structureId);
    refresh(structureId);
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function archiveStructureAction(structureId: string): Promise<ActionResult> {
  try {
    const ctx = await requireApiRole("ADMIN", "ACCOUNTS");
    await archiveStructure(ctx, structureId);
    refresh(structureId);
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function assignClassAction(structureId: string, classId: string): Promise<ActionResult & { result?: AssignResult }> {
  try {
    const ctx = await requireApiRole("ADMIN", "ACCOUNTS");
    const result = await assignPlans(ctx, { structureId, classId });
    refresh(structureId);
    return { ok: true, result };
  } catch (error) {
    return failure(error);
  }
}

/** Open a published structure to families, or close it; pupils already on it stay. */
export async function setSelfEnrolAction(structureId: string, open: boolean): Promise<ActionResult> {
  try {
    const ctx = await requireApiRole("ADMIN", "ACCOUNTS");
    await setStructureSelfEnrol(ctx, structureId, open);
    refresh(structureId);
    revalidatePath("/parent/fees");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}
