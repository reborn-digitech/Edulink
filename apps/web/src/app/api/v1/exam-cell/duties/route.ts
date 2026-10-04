import { examDutiesSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { myDuties } from "@/lib/exam-cell-after";
import { ok } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/exam-cell/duties — A faculty member's exam duties: invigilation, papers to set, bundles, remuneration. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("FACULTY", "HOD");
    return ok(examDutiesSchema.parse(await myDuties(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/exam-cell/duties");
  }
}
