import { academicsIdResultSchema, schemeSaveSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { saveScheme } from "@/lib/academics";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** POST /api/v1/academics/schemes — A scheme made or changed: the grading table and the passing rules, coded. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("ADMIN");
    const parsed = schemeSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(academicsIdResultSchema.parse(await saveScheme(ctx, q)));
  } catch (error) {
    return moduleFailure(error, "api/v1/academics/schemes");
  }
}
