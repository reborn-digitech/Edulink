"use server";

import { redirect } from "next/navigation";
import { answerByLink } from "@/lib/iqac";
import { AccessError } from "@/lib/access-error";
import { RuleRefusal } from "@/lib/rule-refusal";
import { CODE_LOOKUPS, consumeByCaller } from "@/lib/rate-limit";
import { getT } from "@/lib/i18n/server";

/**
 * A signed-out respondent's answer through the link the IQAC desk sent them
 * (G-5). Counted per address as the certificate check is; one answer per
 * link; the page says what came of it.
 */
export async function answerByLinkAction(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");
  const back = `/survey/${encodeURIComponent(token)}`;
  const gate = await consumeByCaller("survey-link", CODE_LOOKUPS);
  if (!gate.allowed) redirect(`${back}?error=limited`);
  const answers: Record<string, number> = {};
  for (const [k, v] of formData.entries()) if (k.startsWith("q_") && typeof v === "string") answers[k.slice(2)] = Number(v);
  try {
    await answerByLink(token, answers, await getT());
  } catch (error) {
    if (error instanceof RuleRefusal || error instanceof AccessError) redirect(`${back}?error=${encodeURIComponent(error.key)}`);
    throw error;
  }
  redirect(`${back}?done=1`);
}
