import { familyRecordQuerySchema, pupilRecordViewSchema } from "@edulink/contracts";
import { requireApiReader, selectChild } from "@/lib/api-reads/family";
import { pupilRecordFor } from "@/lib/pupil-records";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";
import type { ActiveContext } from "@/lib/session";

async function whose(ctx: ActiveContext & { role: "STUDENT" | "PARENT" }, childId?: string): Promise<string> {
  if (ctx.role === "STUDENT") return ctx.membershipId!;
  return (await selectChild(ctx, childId)).selectedId;
}

/**
 * GET /api/v1/family/record?childId= — the record, with what is still blank
 * and the ask that waits on it. There is no POST: the family reads the
 * record and asks the office for a change at /api/v1/family/record/changes.
 */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiReader();
    const parsed = familyRecordQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(pupilRecordViewSchema.parse(await pupilRecordFor(ctx, await whose(ctx, parsed.data.childId))));
  } catch (error) {
    return apiFailure(error, "api/v1/family/record");
  }
}
