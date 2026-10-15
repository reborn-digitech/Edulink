import "server-only";
import { notFound } from "next/navigation";
import { getSession } from "./session";
import { accessTo, assertAnyFeatureOn, featureOn, type FeatureCode } from "./platform-features";
import type { PlanCode } from "@edulink/contracts";

/** What a locked page shows instead of itself: the plan card for this plan (components/plan-card.tsx). */
export type PageLock = { plan: PlanCode; feature: FeatureCode };

/**
 * FOR A PAGE OR A LAYOUT OF A PLATFORM FEATURE (15 Oct 2026; src/lib/platform-features.ts): the app's 404 while the
 * operator has the feature off (any of a list, for a page two features share), and — since 16 October 2026 — the
 * PLAN the person lacks while it is on and their role needs one (src/lib/person-plans.ts), which the layout draws as
 * the plan card in place of its children; null when the page is open. Called at the top of the feature's layout,
 * so every page under it is covered. The nav keeps the entry while the feature is on, so the card is reachable.
 * Kept apart from platform-features.ts because it reads the session, which the session's own gate must not import.
 *
 *   const lock = await featurePageLock("QUESTION_BANK");
 *   return lock ? <PlanCard {...lock} /> : children;
 */
export async function featurePageLock(feature: FeatureCode | readonly FeatureCode[]): Promise<PageLock | null> {
  const ctx = await getSession();
  const access = await accessTo(typeof feature === "string" ? [feature] : feature, ctx);
  if (access.state === "off") notFound();
  return access.state === "plan" ? { plan: access.plan, feature: access.feature } : null;
}

/**
 * FOR A PAGE A LAPSED PLAN MUST KEEP OPEN (16 Oct 2026): the app's 404 while the platform switch is off, and nothing
 * more — an expert's earnings and the sessions already booked with them stay theirs to read after their plan ends
 * (the catalog's `planFree` doors say the same).
 */
export async function requireFeatureSwitchPage(feature: FeatureCode | readonly FeatureCode[]): Promise<void> {
  for (const code of typeof feature === "string" ? [feature] : feature) if (await featureOn(code)) return;
  notFound();
}

/**
 * FOR A SERVER ACTION OF A PLATFORM FEATURE: a server action is its own entry point (anybody who can POST
 * reaches it, layout or no layout), so each feature's actions assert it too. Throws FeatureOffError, an
 * AccessError, which every action boundary already turns into the reader's sentence; PlanRequiredError (16 Oct
 * 2026) for a person who lacks the feature's plan, whose sentence names the plan.
 */
export async function assertFeatureForAction(feature: FeatureCode | readonly FeatureCode[]): Promise<void> {
  const list = typeof feature === "string" ? [feature] : feature;
  await assertAnyFeatureOn(list, await getSession());
}
