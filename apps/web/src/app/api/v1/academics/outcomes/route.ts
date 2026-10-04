import { academicsCountResultSchema, programmeOutcomesSaveSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { saveProgrammeOutcomes } from "@/lib/academics";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** POST /api/v1/academics/outcomes — A programme's outcomes, replaced whole (the office, or the department's HOD). */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("ADMIN", "HOD");
    const parsed = programmeOutcomesSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(academicsCountResultSchema.parse(await saveProgrammeOutcomes(ctx, q)));
  } catch (error) {
    return moduleFailure(error, "api/v1/academics/outcomes");
  }
}
