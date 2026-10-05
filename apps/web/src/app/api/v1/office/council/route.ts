import { studentCouncilSaveSchema, studentCouncilViewSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { saveCouncil } from "@/lib/council-notices";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** POST /api/v1/office/council — the office names the student council and its members by student code (audited). */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("ADMIN");
    const parsed = studentCouncilSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(studentCouncilViewSchema.parse(await saveCouncil(ctx, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/office/council");
  }
}
