import { examActionResultSchema, myBacklogAddSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { addBacklog } from "@/lib/exam-cell-after";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** POST /api/v1/exam-cell/mine/backlogs — Put an open backlog on one's form; refused after the seven-year limit. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("STUDENT");
    const parsed = myBacklogAddSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(examActionResultSchema.parse(await addBacklog(ctx, b)));
  } catch (error) {
    return moduleFailure(error, "api/v1/exam-cell/mine/backlogs");
  }
}
