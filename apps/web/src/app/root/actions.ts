"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { requireApiUser, AccessError } from "@/lib/tenancy";
import {
  createSchool,
  updateSchool,
  removeSchools, deleteSchoolsEntirely, removeSchool,
  restoreSchool,
  setSchoolVerified,
  deleteSchoolEntirely,
  inviteAdmin,
  revokeInvite,
  appointAppAdmin,
  dismissAppAdmin,
  assertSuperuser,
  resendAdminInvite,
  sendAdminResetLink,
  signOutAdminEverywhere,
  type SchoolDetails,
} from "@/lib/superuser";
import { assignPlan, createPlan, deletePlan, updatePlan, type PlanInput } from "@/lib/plans";
import { createPartner, lookForOnboarded, onboardSchool, previewOnboarding, setContact, setSubscription, updatePartner, type OnboardingField } from "@/lib/subscriptions";
import { onboardSentence } from "@/lib/terms-sentences";
import { consoleFmt } from "./subscriptions/fmt";
import { operatorOnboardBodySchema, operatorSubscriptionBodySchema, type OperatorContactBody, type OperatorOnboardBody, type OperatorPartnerBody, type OperatorPartnerUpdateBody } from "@edulink/contracts";

/**
 * Operator actions.
 *
 * Every one re-reads the session and re-asserts the flag. The `/root` layout
 * already gates the pages, but a server action is its own entry point — it is
 * reachable by anybody who can POST, layout or no layout, and a gate that only
 * exists in a layout is a gate on the furniture.
 */

/** An answer; `stale` marks a correction refused because the record changed since its form was drawn, so the page draws itself again. */
type Result = { ok: boolean; error?: string; schoolId?: string; code?: string; stale?: true };

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

/**
 * Removes a school. The lib turns the whole roll into leavers first — every
 * pupil keeps their account and gets a certificate — and only then flags the
 * school; see removeSchool for why that order.
 */
export async function removeSchoolAction(schoolId: string): Promise<Result> {
  try {
    const session = await requireApiUser();
    assertSuperuser(session);
    const result = await removeSchool(session, schoolId);
    if (!result.ok && result.errorKey) return { ok: false, error: (await getT())(result.errorKey) };
    revalidatePath("/root");
    revalidatePath(`/root/${schoolId}`);
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

/**
 * Erases a school for good. The typed name travels with the request and is
 * checked in the lib, not only in the dialog — a POST is its own entry point.
 */
export async function deleteSchoolAction(schoolId: string, confirmName: string): Promise<Result> {
  try {
    const session = await requireApiUser();
    assertSuperuser(session);
    const result = await deleteSchoolEntirely(session, schoolId, confirmName);
    if (!result.ok && result.errorKey) return { ok: false, error: (await getT())(result.errorKey) };
    revalidatePath("/root");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export type BulkResult = { ok: boolean; done: number; failed: string[]; error?: string };

/** Removes several schools at once: each through the single door, reported per school. */
export async function removeSchoolsAction(schoolIds: string[]): Promise<BulkResult> {
  try {
    const session = await requireApiUser();
    assertSuperuser(session);
    const t = await getT();
    const outcome = await removeSchools(session, schoolIds);
    revalidatePath("/root");
    return { ok: outcome.failed.length === 0, done: outcome.done, failed: outcome.failed.map((f) => `${f.name ?? f.id}: ${t(f.errorKey)}`) };
  } catch (error) {
    return { ...(await failure(error)), done: 0, failed: [] };
  }
}

/** Erases several schools for good, behind the typed "DELETE n" the lib checks. */
export async function deleteSchoolsAction(schoolIds: string[], confirmPhrase: string): Promise<BulkResult> {
  try {
    const session = await requireApiUser();
    assertSuperuser(session);
    const t = await getT();
    const outcome = await deleteSchoolsEntirely(session, schoolIds, confirmPhrase);
    if (!outcome.ok && outcome.errorKey && outcome.done === 0 && outcome.failed.length === 0) {
      return { ok: false, done: 0, failed: [], error: t(outcome.errorKey) };
    }
    revalidatePath("/root");
    return { ok: outcome.ok, done: outcome.done, failed: outcome.failed.map((f) => `${f.name ?? f.id}: ${t(f.errorKey)}`) };
  } catch (error) {
    return { ...(await failure(error)), done: 0, failed: [] };
  }
}

/** Puts a removed school back — the lib revives exactly what removal ended. */
export async function restoreSchoolAction(schoolId: string): Promise<Result> {
  try {
    const session = await requireApiUser();
    assertSuperuser(session);
    const result = await restoreSchool(session, schoolId);
    if (!result.ok && result.errorKey) return { ok: false, error: (await getT())(result.errorKey) };
    revalidatePath("/root");
    revalidatePath(`/root/${schoolId}`);
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

/**
 * Gives or withdraws the operator's mark that a school has been checked —
 * what lets it bring over a pupil who already has an account elsewhere.
 */
export async function setSchoolVerifiedAction(schoolId: string, verified: boolean): Promise<Result> {
  try {
    const session = await requireApiUser();
    assertSuperuser(session);
    const result = await setSchoolVerified(session, schoolId, verified === true);
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

export async function appointAppAdminAction(email: string): Promise<Result> {
  try {
    const session = await requireApiUser();
    assertSuperuser(session);
    const result = await appointAppAdmin(session, email);
    if (!result.ok && result.errorKey) return { ok: false, error: (await getT())(result.errorKey) };
    revalidatePath("/root/content-team");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function dismissAppAdminAction(userId: string): Promise<Result> {
  try {
    const session = await requireApiUser();
    assertSuperuser(session);
    const result = await dismissAppAdmin(session, userId);
    if (!result.ok && result.errorKey) return { ok: false, error: (await getT())(result.errorKey) };
    revalidatePath("/root/content-team");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

/* -------------------------------------------------------------------------- */
/* Plans, and the three support doors (2026-10-01)                            */
/* -------------------------------------------------------------------------- */

/** A plan from the console's form: its code, name and caps. The library writes no monthly price (decision 0010 decision 4), whatever the client sends. */
export async function createPlanAction(input: PlanInput): Promise<Result & { planId?: string }> {
  try {
    const session = await requireApiUser();
    assertSuperuser(session);
    const result = await createPlan(session, input);
    if (!result.ok) return { ok: false, error: (await getT())(result.errorKey) };
    revalidatePath("/root/plans");
    return { ok: true, planId: result.planId };
  } catch (error) {
    return failure(error);
  }
}

export async function updatePlanAction(planId: string, input: Partial<PlanInput>): Promise<Result> {
  try {
    const session = await requireApiUser();
    assertSuperuser(session);
    const result = await updatePlan(session, planId, input);
    if (!result.ok) return { ok: false, error: (await getT())(result.errorKey) };
    revalidatePath("/root/plans");
    revalidatePath("/root");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function deletePlanAction(planId: string): Promise<Result> {
  try {
    const session = await requireApiUser();
    assertSuperuser(session);
    const result = await deletePlan(session, planId);
    if (!result.ok && result.errorKey) return { ok: false, error: (await getT())(result.errorKey) };
    revalidatePath("/root/plans");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

/** Puts a school on a plan, or (null) off every plan; the lib audits it and tells the school's office. */
export async function assignPlanAction(schoolId: string, planId: string | null): Promise<Result> {
  try {
    const session = await requireApiUser();
    assertSuperuser(session);
    const result = await assignPlan(session, schoolId, planId);
    if (!result.ok && result.errorKey) return { ok: false, error: (await getT())(result.errorKey) };
    revalidatePath("/root");
    revalidatePath(`/root/${schoolId}`);
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function resendAdminInviteAction(schoolId: string, inviteId: string): Promise<Result> {
  try {
    const session = await requireApiUser();
    assertSuperuser(session);
    const result = await resendAdminInvite(session, schoolId, inviteId);
    if (!result.ok && result.errorKey) return { ok: false, error: (await getT())(result.errorKey) };
    revalidatePath(`/root/${schoolId}`);
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

/** Emails one of the school's admins a one-time sign-in link; no password is set or seen. */
export async function sendAdminSignInLinkAction(schoolId: string, userId: string): Promise<Result> {
  try {
    const session = await requireApiUser();
    assertSuperuser(session);
    const result = await sendAdminResetLink(session, schoolId, userId);
    if (!result.ok && result.errorKey) return { ok: false, error: (await getT())(result.errorKey) };
    revalidatePath(`/root/${schoolId}`);
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function signOutAdminAction(schoolId: string, userId: string): Promise<Result & { sessionsEnded?: number }> {
  try {
    const session = await requireApiUser();
    assertSuperuser(session);
    const result = await signOutAdminEverywhere(session, schoolId, userId);
    if (!result.ok && result.errorKey) return { ok: false, error: (await getT())(result.errorKey) };
    revalidatePath(`/root/${schoolId}`);
    return { ok: true, sessionsEnded: result.sessionsEnded ?? 0 };
  } catch (error) {
    return failure(error);
  }
}

/* -------------------------------------------------------------------------- */
/* The dashboard: subscriptions, contacts, partners, onboarding (2026-10-02)   */
/* -------------------------------------------------------------------------- */

/** The sentence for a correction's body the contract refuses: a missing reason, a status not on the list, else the form's. */
function subscriptionIssue(issues: { path: PropertyKey[] }[]): TranslationKey {
  if (issues.some((issue) => issue.path[0] === "reason")) return "root.subscriptionReasonRequired";
  if (issues.some((issue) => issue.path[0] === "status")) return "root.subscriptionMoveRefused";
  return "common.checkTheForm";
}

/**
 * A correction of the subscription record from the school's page. The input is parsed with the door's contract before the
 * library is called, as a server action is a public POST; a body the contract refuses is answered with a sentence, never an
 * issue list. A correction refused because the record changed since its form was drawn is marked `stale`.
 */
export async function setSubscriptionAction(schoolId: string, input: unknown): Promise<Result> {
  try {
    const session = await requireApiUser();
    assertSuperuser(session);
    const parsed = operatorSubscriptionBodySchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: (await getT())(subscriptionIssue(parsed.error.issues)) };
    const result = await setSubscription(session, schoolId, parsed.data);
    if (!result.ok) return { ok: false, error: (await getT())(result.errorKey), ...(result.errorKey === "root.subscriptionChangedMeanwhile" ? { stale: true as const } : {}) };
    revalidatePath("/root");
    revalidatePath(`/root/${schoolId}`);
    revalidatePath("/root/partners");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function setContactAction(schoolId: string, input: OperatorContactBody): Promise<Result> {
  try {
    const session = await requireApiUser();
    assertSuperuser(session);
    const result = await setContact(session, schoolId, input);
    if (!result.ok) return { ok: false, error: (await getT())(result.errorKey) };
    revalidatePath("/root");
    revalidatePath(`/root/${schoolId}`);
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function createPartnerAction(input: OperatorPartnerBody): Promise<Result & { partnerId?: string }> {
  try {
    const session = await requireApiUser();
    assertSuperuser(session);
    const result = await createPartner(session, input);
    if (!result.ok) return { ok: false, error: (await getT())(result.errorKey) };
    revalidatePath("/root/partners");
    revalidatePath("/root");
    return { ok: true, partnerId: result.partnerId };
  } catch (error) {
    return failure(error);
  }
}

export async function updatePartnerAction(partnerId: string, input: OperatorPartnerUpdateBody): Promise<Result> {
  try {
    const session = await requireApiUser();
    assertSuperuser(session);
    const result = await updatePartner(session, partnerId, input);
    if (!result.ok) return { ok: false, error: (await getT())(result.errorKey) };
    revalidatePath("/root/partners");
    revalidatePath("/root");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

/** The guided flow's one call: the lib checks everything before the first write and makes the rest in one transaction, so a refused invitation leaves nothing behind; the invitation's mail goes after the commit. */
/**
 * A body the onboard contract refuses, told in the sentence onboarding itself gives for that field (the review of phase 6,
 * point 1): the parse runs before onboardSchool, so a share over 100 %, an AISHE code not as AISHE issues it, a web address
 * with other characters, a day not on the calendar or a figure out of bounds would otherwise all read as the form's catch-all.
 * A key the contract names itself is used first; anything else is the catch-all.
 */
function onboardIssueKey(issues: { message: string; path: PropertyKey[] }[], input: unknown): TranslationKey {
  const named = issues.map((i) => i.message).find((m) => /^(root|subs|college)\.[A-Za-z]+$/.test(m));
  if (named) return named as TranslationKey;
  const [top, second, third] = (issues[0]?.path ?? []).map(String);
  // A new partner refused whole by the commission's union (a share that is not a number fails both of its branches, so zod
  // names no deeper path): the partner's own fields are read for the sentence onboarding gives (the second review's A2).
  const partner = (input as { commission?: { newPartner?: { name?: unknown; percentTenths?: unknown; email?: unknown } } } | null)?.commission?.newPartner;
  if (top === "commission" && second === undefined && partner) {
    const share = partner.percentTenths;
    if (typeof share !== "number" || !Number.isInteger(share) || share < 0 || share > 1000) return "root.partnerPercentInvalid";
    if (typeof partner.name !== "string" || !partner.name.trim()) return "root.partnerNameRequired";
    if (typeof partner.email === "string" && partner.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(partner.email.trim())) return "root.emailLooksWrong";
  }
  if (top === "commission" && second === "newPartner") {
    if (third === "percentTenths") return "root.partnerPercentInvalid";
    if (third === "name") return "root.partnerNameRequired";
    if (third === "email") return "root.emailLooksWrong";
  }
  if (top === "aisheCode") return "college.profileCheck";
  if (top === "slug") return "root.slugHint";
  if (top === "startsAt" || top === "dueAt") return "root.subscriptionDayNotReal";
  if (top === "subscription" || top === "premium") return "subs.invalid";
  if (top === "adminEmail" || top === "contactEmail" || (top === "contact" && second === "email")) return "root.emailLooksWrong";
  return "root.onboardInvalid";
}

/** The field of the onboarding form each refusal of the terms is shown under. */
const ONBOARD_FIELD_OF: Partial<Record<TranslationKey, OnboardingField>> = {
  "root.renewalOverAYear": "dueAt",
  "root.renewalBeforeToday": "dueAt",
  "root.renewalBeforeStart": "dueAt",
  "root.subscriptionDayNotReal": "dueAt",
  "root.termsOwnPriceAtCollege": "subscription",
  "root.termsTeachersAtCollege": "premium",
  "operatorCollege.refuseTierNotCollege": "tier",
  "operatorCollege.refuseTierKind": "tier",
  "root.tierOrPlan": "tier",
  "refusal.timezoneUnknown": "timezone",
};

/**
 * Onboarding's save. A refusal is a decision of the server's (a field, a rule, the session ended, not the operator); an error it
 * only caught leaves the outcome unknown, the school perhaps made (the database's acknowledgement of the commit lost), so it
 * is answered `unknown` in its own sentence, and the form keeps what it sent and looks first on the next press (the
 * coordinating session's reading of C7a point 1b in its review of 07d594f3, L3).
 */
export async function onboardSchoolAction(input: OperatorOnboardBody): Promise<Result & { slug?: string; field?: OnboardingField; unknown?: true }> {
  try {
    const session = await requireApiUser();
    assertSuperuser(session);
    // Parsed with the door's own contract (§2.5; phase 6): a malformed body is refused with the form's sentence, never thrown.
    const parsed = operatorOnboardBodySchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: (await getT())(onboardIssueKey(parsed.error.issues, input)) };
    const result = await onboardSchool(session, parsed.data);
    if (!result.ok) {
      // A refusal of the terms names the field it is shown under, as the summary's refusals do (the second review's C5).
      const field = ONBOARD_FIELD_OF[result.errorKey];
      return { ok: false, error: (await getT())(result.errorKey), ...(field ? { field } : {}) };
    }
    revalidatePath("/root");
    revalidatePath("/root/partners");
    return { ok: true, schoolId: result.schoolId, code: result.code, slug: result.slug };
  } catch (error) {
    if (error instanceof AccessError) return failure(error);
    console.error("[root] onboard", error);
    return { ok: false, error: (await getT())("root.onboardUnknown"), unknown: true };
  }
}

// `since` is the moment the page was served, as the page wrote it (toISOString); anything else is refused, never read as "none".
const onboardLookSchema = z.object({ since: z.string().datetime(), name: z.string().trim().min(1).max(200), adminEmail: z.string().trim().min(1).max(320) });

/**
 * C7.8's look before a second send (C7a point 1): asked by the form's next press after an onboarding request went unanswered,
 * with the name and the administrator's address that request carried and the moment the page was served; it answers the
 * school that request made, if it is there (lookForOnboarded), and writes nothing. A refusal of the question (the session
 * has ended; the caller is not the operator) is the server's own sentence; an error has none, and the form says of it what
 * it says of a request not answered.
 */
export async function onboardLookAction(input: unknown): Promise<{ ok: true; found: { id: string; name: string } | null } | { ok: false; error: string | null }> {
  try {
    const session = await requireApiUser();
    assertSuperuser(session);
    const parsed = onboardLookSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: null };
    return await lookForOnboarded(session, parsed.data);
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: (await getT())(error.key, error.vars) };
    console.error("[root] onboard look", error);
    return { ok: false, error: null };
  }
}

/**
 * The fields onboarding's summary reads (§2.5): the onboard body's own, the zone optional while the form is filled in, and the
 * school's name, which the summary is worded with: the form asks only once one is typed, since a stand-in name would break the
 * Hindi and Marathi sentences it sits in (the review of phase 6, point 5).
 */
const onboardPreviewSchema = operatorOnboardBodySchema
  .pick({ kind: true, startsAt: true, dueAt: true, subscription: true, premium: true, freeMonths: true, tier: true })
  .extend({ name: z.string().trim().min(2).max(200), timezone: z.string().trim().max(64).optional() });

type OnboardPreviewSaid =
  | { ok: true; sentence: string; status: "TRIAL" | "DUE"; renewsOn: string; impliedMonths: number | null; asks: { overAYear: boolean; dueNow: boolean }; figures: { subscriptionPaise: number | null; premiumPaise: number } }
  | { ok: false; error: string; field?: OnboardingField };

/**
 * Onboarding's summary (§2.5; phase 6): the sentence the form shows under "Subscription and premium", asked as its fields
 * change, from previewOnboarding, which writes nothing (rule 12: every sentence is the server's); with it the renewal and
 * the status onboarding will set and the ticks the renewal needs. A refusal names the field it is shown under.
 */
export async function onboardPreviewAction(input: unknown): Promise<OnboardPreviewSaid> {
  try {
    const session = await requireApiUser();
    assertSuperuser(session);
    const f = await consoleFmt();
    const parsed = onboardPreviewSchema.safeParse(input);
    if (!parsed.success) {
      // A figure or a day the contract refuses is shown under its own field (§2.5), a figure in the figures' own sentence.
      const top = parsed.error.issues[0]?.path[0];
      const field = (["subscription", "premium", "startsAt", "dueAt", "tier", "timezone"] as const).find((name) => name === top);
      const key = parsed.error.issues.map((i) => i.message).find((m) => /^(root|subs)\.[A-Za-z]+$/.test(m));
      const error = f.t((key ?? (field === "subscription" || field === "premium" ? "subs.invalid" : "root.onboardInvalid")) as Parameters<typeof f.t>[0]);
      return field ? { ok: false, error, field } : { ok: false, error };
    }
    const result = await previewOnboarding(session, { ...parsed.data, timezone: parsed.data.timezone || "Asia/Kolkata" });
    if (!result.ok) return { ok: false, error: f.t(result.errorKey), field: result.field };
    const p = result.preview;
    const sentence = onboardSentence(f, {
      school: parsed.data.name,
      subscription: p.subscription,
      premium: { students: parsed.data.premium?.students ?? false, teachers: parsed.data.premium?.teachers ?? false, figure: p.premium, billed: p.premiumBilled, waitsFor: p.premiumWaitsFor },
      startsOn: p.startsOn,
      renewsOn: p.renewsOn,
      status: p.status,
      impliedMonths: p.impliedMonths,
    });
    return { ok: true, sentence, status: p.status, renewsOn: p.renewsOn, impliedMonths: p.impliedMonths, asks: p.asks, figures: { subscriptionPaise: p.subscription?.paysPaise ?? null, premiumPaise: p.premium.paysPaise } };
  } catch (error) {
    return { ok: false, error: (await failure(error)).error ?? "" };
  }
}
