import { voiceSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { myVoice } from "@/lib/iqac";
import { ok } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/voice — The surveys open to me and, for a student, my grievances. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("STUDENT", "ALUMNUS", "FACULTY", "HOD");
    return ok(voiceSchema.parse(await myVoice(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/voice");
  }
}
