import { grievanceActionSchema, grievanceDeskSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { actOnGrievance } from "@/lib/iqac";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** POST /api/v1/iqac/grievances/{grievanceId} — Acknowledge, resolve or send to the Ombudsperson; the student is told. */
export async function POST(request: Request, { params }: { params: Promise<{ grievanceId: string }> }) {
  try {
    const ctx = await requireApiRoles("ADMIN", "PRINCIPAL");
    const p = await params;
    const parsed = grievanceActionSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(grievanceDeskSchema.parse(await actOnGrievance(ctx, p.grievanceId, b)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/grievances/[grievanceId]");
  }
}
