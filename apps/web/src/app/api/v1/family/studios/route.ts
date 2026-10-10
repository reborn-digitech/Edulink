import { studentStudiosSchema } from "@edulink/contracts";
import { ok } from "@/lib/api-v1";
import { requireApiRole } from "@/lib/tenancy";
import { moduleFailure } from "@/lib/rule-refusal";
import { studentStudios } from "@/lib/studio";

/** GET /api/v1/family/studios — a student's studios: the brief, the stages, their submissions and the signed results (R-56, the studio half, 10 Oct 2026). */
export async function GET() {
  try {
    const ctx = await requireApiRole("STUDENT");
    return ok(studentStudiosSchema.parse(await studentStudios(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/family/studios");
  }
}
