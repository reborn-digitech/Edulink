import { contestCreateSchema, contestCreatedSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { createCompetition } from "@/lib/competitions";
import { competitionFormSchema, fieldErrorsOf } from "@/lib/competition-forms";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { apiRefused } from "@/lib/api-reads/admin";
import { getT } from "@/lib/i18n/server";

/**
 * POST /api/v1/contest/competitions — a school admin posts one, as a DRAFT.
 * The body's shape is the contract's; its rules are the web form's
 * (competitionFormSchema), so a short title or an end before the start is
 * refused with the field named and in the reader's language.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = contestCreateSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const t = await getT();
    const form = competitionFormSchema(t).safeParse(parsed.data);
    if (!form.success) return apiRefused({ error: t("competitions.needsAnotherLook"), issues: fieldErrorsOf(form.error) });
    const competitionId = await createCompetition(ctx, form.data);
    return ok(contestCreatedSchema.parse({ competitionId, status: "DRAFT" }), 201);
  } catch (error) {
    return apiFailure(error, "api/v1/contest/competitions");
  }
}
