"use server";

import { badgeSaveSchema, deviceSaveSchema } from "@edulink/contracts";
import { revalidatePath } from "next/cache";
import { requireApiUser } from "@/lib/tenancy";
import { field } from "@/lib/module-actions";
import { registerDevice, removeBadge, rotateDeviceKey, saveBadge, updateDevice } from "@/lib/attendance-devices";
import { answerForm } from "@/lib/form-action";
import { refusalOf, type FormState } from "@/lib/form-state";
import { getT } from "@/lib/i18n/server";
import type { KeyFormState } from "@/components/attendance-devices/key-state";

/**
 * The office's writes for the attendance devices (R-2, 5 Oct 2026). A new
 * device and a rotated key answer with the key itself, once, into the page's
 * key box (never a redirect, so it is in no address and no log). The rest are
 * ordinary forms. Only async functions exported.
 */
const PAGE = "/admin/attendance-devices";

async function keyAnswer(work: () => Promise<{ key: string; endpoint: string; device: { id: string; name: string } }>): Promise<KeyFormState> {
  const t = await getT();
  try {
    const issued = await work();
    revalidatePath(PAGE);
    return { ok: true, key: issued.key, endpoint: issued.endpoint, deviceId: issued.device.id, deviceName: issued.device.name };
  } catch (error) {
    const digest = (error as { digest?: unknown } | null)?.digest;
    if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) throw error;
    const refusal = refusalOf(error, t);
    if (!refusal) console.error("[attendance-devices]", error);
    return { ok: false, message: refusal?.message ?? t("common.somethingWrong") };
  }
}

export async function registerDeviceAction(_previous: KeyFormState, form: FormData): Promise<KeyFormState> {
  return keyAnswer(async () => registerDevice(await requireApiUser(), deviceSaveSchema.parse({ name: field(form, "name"), kind: field(form, "kind"), location: field(form, "location"), scope: field(form, "scope") })));
}

export async function rotateKeyAction(_previous: KeyFormState, form: FormData): Promise<KeyFormState> {
  return keyAnswer(async () => rotateDeviceKey(await requireApiUser(), field(form, "deviceId")));
}

export async function toggleDeviceAction(previous: FormState, form: FormData): Promise<FormState> {
  return answerForm(
    previous,
    form,
    async () => {
      const disabled = field(form, "disabled") === "true";
      await updateDevice(await requireApiUser(), field(form, "deviceId"), { disabled });
      return disabled ? "punch.deviceDisabled" : "punch.deviceEnabled";
    },
    { revalidate: [PAGE] },
  );
}

export async function saveBadgeAction(previous: FormState, form: FormData): Promise<FormState> {
  return answerForm(
    previous,
    form,
    async () => {
      await saveBadge(await requireApiUser(), badgeSaveSchema.parse({ code: field(form, "code"), membershipId: field(form, "membershipId") }));
      return "punch.badgeSaved";
    },
    { revalidate: [PAGE] },
  );
}

export async function removeBadgeAction(previous: FormState, form: FormData): Promise<FormState> {
  return answerForm(
    previous,
    form,
    async () => {
      await removeBadge(await requireApiUser(), field(form, "badgeId"));
      return "punch.badgeRemoved";
    },
    { revalidate: [PAGE] },
  );
}
