import "server-only";
import { notFound } from "next/navigation";
import { getSession } from "./session";
import { assertAnyFeatureOn, mayUseAny, type FeatureCode } from "./platform-features";

/**
 * FOR A PAGE OR A LAYOUT OF A PLATFORM FEATURE (15 Oct 2026; src/lib/platform-features.ts): the app's 404
 * unless the signed-in person may use the feature (any of a list, for a page two features share). Called at
 * the top of the feature's layout, so every page under it is covered; the menu entry is already gone
 * (nav.ts `feature`), so this answers only a typed-in or remembered address. Kept apart from
 * platform-features.ts because it reads the session, which the session's own gate must not import.
 */
export async function requireFeaturePage(feature: FeatureCode | readonly FeatureCode[]): Promise<void> {
  const ctx = await getSession();
  if (!(await mayUseAny(typeof feature === "string" ? [feature] : feature, ctx))) notFound();
}

/**
 * FOR A SERVER ACTION OF A PLATFORM FEATURE: a server action is its own entry point (anybody who can POST
 * reaches it, layout or no layout), so each feature's actions assert it too. Throws FeatureOffError, an
 * AccessError, which every action boundary already turns into the reader's sentence.
 */
export async function assertFeatureForAction(feature: FeatureCode | readonly FeatureCode[]): Promise<void> {
  const list = typeof feature === "string" ? [feature] : feature;
  await assertAnyFeatureOn(list, await getSession());
}
