"use server";

import { revalidatePath } from "next/cache";
import type { ViduraReferenceAct, ViduraReferenceAdd } from "@edulink/contracts";
import { viduraReferenceActSchema, viduraReferenceAddSchema } from "@edulink/contracts";
import { getT } from "@/lib/i18n/server";
import { requireApiUser, AccessError } from "@/lib/tenancy";
import { RuleRefusal } from "@/lib/rule-refusal";
import { actOnReferenceSource, addReferenceSource } from "@/lib/assistant/references";

/**
 * The operator's presses on Vidura's reference sources (pass 4, 18 Oct 2026): add a source, edit it, switch it off and
 * on. Each re-reads the session and the library asserts the operator and checks the host and the template; a server
 * action is reachable by anybody who can POST.
 */
type Failure = { ok: false; error: string; field?: string };

async function failure(error: unknown): Promise<Failure> {
  const t = await getT();
  if (error instanceof RuleRefusal) return { ok: false, error: t(error.key, error.vars), field: error.field };
  if (error instanceof AccessError) return { ok: false, error: t(error.key, error.vars) };
  console.error("[vidura-references]", error);
  return { ok: false, error: t("common.tryAgainMoment") };
}

export async function addReferenceAction(input: ViduraReferenceAdd): Promise<{ ok: true } | Failure> {
  try {
    const session = await requireApiUser();
    const parsed = viduraReferenceAddSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: (await getT())("viduraOps.refInvalid") };
    await addReferenceSource(session, parsed.data);
    revalidatePath("/root/vidura-references");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function actReferenceAction(sourceId: string, act: ViduraReferenceAct): Promise<{ ok: true } | Failure> {
  try {
    const session = await requireApiUser();
    const parsed = viduraReferenceActSchema.safeParse(act);
    if (!parsed.success) return { ok: false, error: (await getT())("viduraOps.refInvalid") };
    await actOnReferenceSource(session, sourceId, parsed.data);
    revalidatePath("/root/vidura-references");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}
