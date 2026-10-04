import { grievanceEscalateSchema, voiceSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { escalateMyGrievance } from "@/lib/iqac";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** POST /api/v1/voice/grievances/{grievanceId}/escalate — Take my grievance to the Ombudsperson once the committee is past its limit or has decided. */
export async function POST(request: Request, { params }: { params: Promise<{ grievanceId: string }> }) {
  try {
    const ctx = await requireApiRoles("STUDENT");
    const p = await params;
    const parsed = grievanceEscalateSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(voiceSchema.parse(await escalateMyGrievance(ctx, p.grievanceId, b.note)));
  } catch (error) {
    return moduleFailure(error, "api/v1/voice/grievances/[grievanceId]/escalate");
  }
}
