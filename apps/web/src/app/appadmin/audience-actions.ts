"use server";

import { revalidatePath } from "next/cache";
import { getT } from "@/lib/i18n/server";
import { AccessError, requireApiUser } from "@/lib/tenancy";
import { DeskRefusal } from "@/lib/competition-crawl-desk";
import { setCompetitionAudience } from "@/lib/competition-audience";

/**
 * Who a platform competition is for (college-content, 12 Oct 2026): the desk's press on /appadmin and
 * /root/competitions, for a listed competition and a suggestion alike. The library asserts the content team's
 * gate (the operator passes it) and audits.
 */
export async function setAudienceAction(competitionId: string, edit: { audience: "SCHOOL" | "COLLEGE" | null; streams: string[] }): Promise<{ ok: true; changed: boolean } | { ok: false; error: string }> {
  try {
    const session = await requireApiUser();
    const result = await setCompetitionAudience(session, competitionId, edit);
    revalidatePath("/appadmin");
    revalidatePath("/root/competitions");
    revalidatePath("/competitions");
    return { ok: true, changed: result.changed };
  } catch (error) {
    const t = await getT();
    if (error instanceof AccessError) return { ok: false, error: t(error.key, error.vars) };
    if (error instanceof DeskRefusal) return { ok: false, error: t(error.errorKey) };
    console.error("[competition-audience]", error);
    return { ok: false, error: t("common.tryAgainMoment") };
  }
}
