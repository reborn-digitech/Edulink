import { divisionMadeSchema, divisionSaveSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { createDivision } from "@/lib/academics";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** POST /api/v1/academics/divisions — A division: a class of the college's, named to a programme and year of study. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("ADMIN");
    const parsed = divisionSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(divisionMadeSchema.parse(await createDivision(ctx, q)));
  } catch (error) {
    return moduleFailure(error, "api/v1/academics/divisions");
  }
}
