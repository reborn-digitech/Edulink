"use server";

import { revalidatePath } from "next/cache";
import { COLLEGE_TIERS, operatorCompanyRecruiterInviteBodySchema, schoolModuleSchema } from "@edulink/contracts";
import { getT } from "@/lib/i18n/server";
import { translator } from "@/lib/i18n/dictionary";
import { requireApiUser, AccessError } from "@/lib/tenancy";
import { assertSuperuser } from "@/lib/superuser";
import { createPlan } from "@/lib/plans";
import { setModuleAsOperator, setRecruiterStanding } from "@/lib/operator-college";
import { operatorInviteCompanyRecruiter } from "@/lib/placement-recruiter";
import { RuleRefusal } from "@/lib/rule-refusal";

/**
 * The college console's actions (4 October 2026). Each re-reads the session
 * and re-asserts the flag, as root/actions.ts does: a server action is its
 * own entry point, layout or no layout.
 */

type Result = { ok: boolean; error?: string; sessionsEnded?: number };

async function failure(error: unknown): Promise<Result> {
  if (error instanceof AccessError) return { ok: false, error: (await getT())(error.key, error.vars) };
  console.error("[root/colleges]", error);
  return { ok: false, error: (await getT())("common.tryAgainMoment") };
}

/** Switch a module for an institution on its behalf; the lib audits it twice and tells the admins. */
export async function setSchoolModuleAction(schoolId: string, input: { module: string; on: boolean }): Promise<Result> {
  try {
    const session = await requireApiUser();
    assertSuperuser(session);
    const which = schoolModuleSchema.safeParse(input?.module);
    if (!which.success || typeof input?.on !== "boolean") return { ok: false, error: (await getT())("common.tryAgain") };
    const result = await setModuleAsOperator(session, schoolId, which.data, input.on);
    if (!result.ok) return { ok: false, error: (await getT())(result.errorKey) };
    revalidatePath(`/root/${schoolId}`);
    revalidatePath("/root/colleges");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

/** Add a college tier to the plan list as a plan whose code is the tier's (createPlan audits it); its price is the tier's, computed on read. */
export async function addCollegeTierAction(code: string): Promise<Result> {
  try {
    const session = await requireApiUser();
    assertSuperuser(session);
    const tier = COLLEGE_TIERS.find((x) => x.code === code);
    if (!tier) return { ok: false, error: (await getT())("common.tryAgain") };
    // The plan's name is the record's, kept in English as the operator's other records are.
    const name = translator("en")(tier.code === "college-affiliated" ? "operatorCollege.tierAffiliated" : "operatorCollege.tierAutonomous");
    const result = await createPlan(session, { code: tier.code, name });
    if (!result.ok) return { ok: false, error: (await getT())(result.errorKey) };
    revalidatePath("/root/plans");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

/** Invite a company's first recruiter (TA-090): the company by its GSTIN or CIN, the recruiter by address; the same answer for any address. */
export async function inviteCompanyRecruiterAction(input: { identifier: string; email: string }): Promise<Result> {
  try {
    const session = await requireApiUser();
    assertSuperuser(session);
    const body = operatorCompanyRecruiterInviteBodySchema.safeParse(input);
    if (!body.success) return { ok: false, error: (await getT())(body.error.issues.some((i) => i.path[0] === "identifier") ? "placement.fieldIdentifierHint" : "common.tryAgain") };
    await operatorInviteCompanyRecruiter(session, body.data.identifier, body.data.email);
    revalidatePath("/root/colleges/recruiters");
    return { ok: true };
  } catch (error) {
    if (error instanceof RuleRefusal) return { ok: false, error: (await getT())(error.key, error.vars) };
    return failure(error);
  }
}

/** Disable a recruiter across every college (sessions ended) or enable them again; audited with the reason. */
export async function setRecruiterStandingAction(userId: string, input: { disabled: boolean; reason?: string }): Promise<Result> {
  try {
    const session = await requireApiUser();
    assertSuperuser(session);
    if (typeof input?.disabled !== "boolean") return { ok: false, error: (await getT())("common.tryAgain") };
    const result = await setRecruiterStanding(session, userId, { disabled: input.disabled, reason: typeof input.reason === "string" ? input.reason.slice(0, 500) : undefined });
    if (!result.ok) return { ok: false, error: (await getT())(result.errorKey) };
    revalidatePath("/root/colleges/recruiters");
    return { ok: true, sessionsEnded: result.sessionsEnded };
  } catch (error) {
    return failure(error);
  }
}
