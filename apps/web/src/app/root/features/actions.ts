"use server";

import { revalidatePath } from "next/cache";
import { platformFeatureSchema } from "@edulink/contracts";
import { getT } from "@/lib/i18n/server";
import { requireApiUser, AccessError } from "@/lib/tenancy";
import { assertSuperuser } from "@/lib/superuser";
import { setFeature } from "@/lib/platform-features";
import { FEATURE_META } from "@/lib/feature-meta";

/**
 * The operator's switch for one platform feature (15 Oct 2026). Re-reads the session and re-asserts the
 * flag, as every operator action does: the /root layout gates the page, but an action is its own entry
 * point. The library audits the change and refuses anybody but the operator; the app admin has no switch.
 */
type Result = { ok: true; message: string } | { ok: false; error: string };

export async function setFeatureAction(code: string, on: boolean): Promise<Result> {
  const t = await getT();
  try {
    const session = await requireApiUser();
    assertSuperuser(session);
    const parsed = platformFeatureSchema.safeParse(code);
    if (!parsed.success) return { ok: false, error: t("platformFeatures.unknown") };
    const result = await setFeature(session, parsed.data, on);
    revalidatePath("/root/features");
    revalidatePath("/root");
    if (!result.changed) return { ok: true, message: t("platformFeatures.unchanged") };
    const name = t(FEATURE_META[parsed.data].nameKey);
    return { ok: true, message: on ? t("platformFeatures.switchedOn", { name }) : t("platformFeatures.switchedOff", { name }) };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: t(error.key, error.vars) };
    console.error("[root/features]", error);
    return { ok: false, error: t("common.tryAgainMoment") };
  }
}
