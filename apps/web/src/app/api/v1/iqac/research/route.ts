import { researchItemSaveSchema, researchRegisterSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { addResearchItem, researchRegister } from "@/lib/iqac";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/iqac/research — The research register: a teacher's own, an HOD's department's, the desk's whole college, with the per-teacher ratios. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("IQAC", "ADMIN", "PRINCIPAL", "FACULTY", "HOD");
    return ok(researchRegisterSchema.parse(await researchRegister(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/research");
  }
}

/** POST /api/v1/iqac/research — Add a research item: a teacher's is their own; the desk names the teacher. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("IQAC", "ADMIN", "FACULTY", "HOD");
    const parsed = researchItemSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(researchRegisterSchema.parse(await addResearchItem(ctx, b)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/research");
  }
}
