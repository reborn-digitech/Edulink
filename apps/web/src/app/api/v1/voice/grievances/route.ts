import { grievanceFileSchema, voiceSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { fileGrievance } from "@/lib/iqac";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** POST /api/v1/voice/grievances — Raise a grievance; due in fifteen working days. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("STUDENT");
    const parsed = grievanceFileSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(voiceSchema.parse(await fileGrievance(ctx, b)));
  } catch (error) {
    return moduleFailure(error, "api/v1/voice/grievances");
  }
}
