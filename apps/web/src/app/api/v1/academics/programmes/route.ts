import { academicsIdResultSchema, programmeSaveSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { saveProgramme } from "@/lib/academics";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** POST /api/v1/academics/programmes — A programme made or changed: level, years, intake, regulator, attendance threshold, NEP exit points. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("ADMIN");
    const parsed = programmeSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(academicsIdResultSchema.parse(await saveProgramme(ctx, q)));
  } catch (error) {
    return moduleFailure(error, "api/v1/academics/programmes");
  }
}
