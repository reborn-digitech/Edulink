import { academicsIdResultSchema, termSaveSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { saveTerm } from "@/lib/academics";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** POST /api/v1/academics/terms — A term made or changed, with its registration window. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("ADMIN");
    const parsed = termSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(academicsIdResultSchema.parse(await saveTerm(ctx, q)));
  } catch (error) {
    return moduleFailure(error, "api/v1/academics/terms");
  }
}
