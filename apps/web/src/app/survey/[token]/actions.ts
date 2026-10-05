"use server";

import { redirect } from "next/navigation";
import { answerByLink } from "@/lib/iqac";
import { AccessError } from "@/lib/access-error";
import { CODE_LOOKUPS, consumeByCaller } from "@/lib/rate-limit";
import { getT } from "@/lib/i18n/server";
import { answerForm } from "@/lib/form-action";
import type { FormState } from "@/lib/form-state";

/**
 * A signed-out respondent's answer through the link the IQAC desk sent them
 * (G-5). Counted per address as the certificate check is; one answer per
 * link; the page says what came of it. A refusal (the address over its
 * count, a closed or used link) answers in place with every choice kept
 * (A3-journeys-27); a done goes to the thanks.
 */
export async function answerByLinkAction(previous: FormState, formData: FormData): Promise<FormState> {
  const token = String(formData.get("token") ?? "");
  const answer = await answerForm(previous, formData, async () => {
    const gate = await consumeByCaller("survey-link", CODE_LOOKUPS);
    if (!gate.allowed) throw new AccessError("common.tryAgainMoment", "FORBIDDEN");
    const answers: Record<string, number> = {};
    for (const [k, v] of formData.entries()) if (k.startsWith("q_") && typeof v === "string") answers[k.slice(2)] = Number(v);
    await answerByLink(token, answers, await getT());
    return null;
  });
  if (!answer.ok) return answer;
  redirect(`/survey/${encodeURIComponent(token)}?done=1`);
}
