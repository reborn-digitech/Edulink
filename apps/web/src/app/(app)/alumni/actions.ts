"use server";

import { revalidatePath } from "next/cache";
import { alumniContactPrefSchema, alumniPostSchema } from "@edulink/contracts";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/session";
import { AccessError } from "@/lib/tenancy";
import { joinAlumniDirectory, leaveAlumniDirectory, setConversationClosed } from "@/lib/alumni";
import { createPost } from "@/lib/bulletin";

/**
 * The alumni module's web actions (3 Oct 2026): the directory, a post for the
 * office, and staff closing a room. Each asks the library, which owns every
 * rule; these only turn a refusal into a sentence.
 */
type Result = { ok: boolean; error?: string };

async function refusal(error: unknown, where: string): Promise<Result> {
  const t = await getT();
  if (error instanceof AccessError) return { ok: false, error: t(error.key, error.vars) };
  console.error(`[${where}]`, error);
  return { ok: false, error: t("common.tryAgain") };
}

export async function joinDirectoryAction(input: { city: string; occupation: string; contactPref: string }): Promise<Result> {
  const session = await getSession();
  if (!session) return { ok: false, error: (await getT())("common.logInAgain") };
  const contactPref = alumniContactPrefSchema.safeParse(input?.contactPref);
  if (!contactPref.success) return { ok: false, error: (await getT())("common.tryAgain") };
  try {
    await joinAlumniDirectory(session, { city: String(input.city ?? "").slice(0, 80), occupation: String(input.occupation ?? "").slice(0, 120), contactPref: contactPref.data });
    revalidatePath("/alumni");
    return { ok: true };
  } catch (error) {
    return refusal(error, "joinDirectoryAction");
  }
}

export async function leaveDirectoryAction(): Promise<Result> {
  const session = await getSession();
  if (!session) return { ok: false, error: (await getT())("common.logInAgain") };
  try {
    await leaveAlumniDirectory(session);
    revalidatePath("/alumni");
    return { ok: true };
  } catch (error) {
    return refusal(error, "leaveDirectoryAction");
  }
}

export async function sharePostAction(input: { title: string; body: string }): Promise<Result> {
  const session = await getSession();
  if (!session) return { ok: false, error: (await getT())("common.logInAgain") };
  const parsed = alumniPostSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: (await getT())("common.tryAgain") };
  try {
    if (session.role !== "ALUMNUS") throw new AccessError("access.wrongRoleForThisAction");
    await createPost(session, { scope: "SCHOOL", title: parsed.data.title, body: parsed.data.body, tags: [], media: [], category: "PEOPLE" });
    revalidatePath("/bulletin");
    return { ok: true };
  } catch (error) {
    return refusal(error, "sharePostAction");
  }
}

export async function closeConversationAction(conversationId: string, closed: boolean): Promise<Result> {
  const session = await getSession();
  if (!session) return { ok: false, error: (await getT())("common.logInAgain") };
  try {
    await setConversationClosed(session, String(conversationId), Boolean(closed));
    revalidatePath(`/remarks/c/${conversationId}`);
    return { ok: true };
  } catch (error) {
    return refusal(error, "closeConversationAction");
  }
}
