"use server";

import { revalidatePath } from "next/cache";
import { operatorGrantBodySchema, operatorPersonPlanBodySchema, platformFeatureSchema } from "@edulink/contracts";
import { getLocale, getT } from "@/lib/i18n/server";
import { formatInZone } from "@/lib/dates";
import { grantPlan, PLAN_NAME_KEY, revokeEntitlement, setPersonPlan } from "@/lib/person-plans";
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

/* ---- plans (16 Oct 2026): the plans sold per person, the grant and the revoke (src/lib/person-plans.ts) ---- */


/** One plan's prices (paise) or its active switch; audited by the library, a no-op when nothing changes. */
export async function setPlanAction(input: { code: string; pricePaise?: number; yearlyPricePaise?: number; active?: boolean }): Promise<Result> {
  const t = await getT();
  try {
    const session = await requireApiUser();
    assertSuperuser(session);
    const parsed = operatorPersonPlanBodySchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: t("plans.priceInvalid") };
    const result = await setPersonPlan(session, parsed.data);
    revalidatePath("/root/features");
    const name = t(PLAN_NAME_KEY[parsed.data.code]);
    return { ok: true, message: result.changed ? t("plans.saved", { name }) : t("plans.unchanged") };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: t(error.key, error.vars) };
    console.error("[root/features plans]", error);
    return { ok: false, error: t("common.tryAgainMoment") };
  }
}

/** The operator's grant: a plan to a person by email for 1, 3, 6 or 12 months, with a note. */
export async function grantPlanAction(input: { email: string; plan: string; months: number; note?: string }): Promise<Result> {
  const t = await getT();
  try {
    const session = await requireApiUser();
    assertSuperuser(session);
    const parsed = operatorGrantBodySchema.safeParse({ ...input, note: input.note?.trim() ? input.note : undefined });
    if (!parsed.success) return { ok: false, error: t("plans.grantInvalid") };
    const g = await grantPlan(session, parsed.data);
    revalidatePath("/root/features");
    return { ok: true, message: t("plans.granted", { name: t(PLAN_NAME_KEY[g.plan]), until: formatInZone(g.validTo, "Asia/Kolkata", { dateStyle: "medium" }, await getLocale()) }) };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: t(error.key, error.vars) };
    console.error("[root/features grant]", error);
    return { ok: false, error: t("common.tryAgainMoment") };
  }
}

/** End one entitlement now. */
export async function revokeEntitlementAction(id: string): Promise<Result> {
  const t = await getT();
  try {
    const session = await requireApiUser();
    assertSuperuser(session);
    const r = await revokeEntitlement(session, id);
    revalidatePath("/root/features");
    return { ok: true, message: r.changed ? t("plans.revoked") : t("plans.alreadyRevoked") };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: t(error.key, error.vars) };
    console.error("[root/features revoke]", error);
    return { ok: false, error: t("common.tryAgainMoment") };
  }
}
/* ---- end plans ---- */
