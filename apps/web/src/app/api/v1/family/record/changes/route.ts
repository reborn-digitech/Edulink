import { familyRecordQuerySchema, recordChangeFileSchema, recordChangeSchema, recordChangesListSchema } from "@edulink/contracts";
import { requireApiReader, selectChild } from "@/lib/api-reads/family";
import { familyRecordChanges, fileRecordChange } from "@/lib/record-changes";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import type { ActiveContext } from "@/lib/session";

async function whose(ctx: ActiveContext & { role: "STUDENT" | "PARENT" }, childId?: string): Promise<string> {
  if (ctx.role === "STUDENT") return ctx.membershipId!;
  return (await selectChild(ctx, childId)).selectedId;
}

/** GET /api/v1/family/record/changes?childId= — what the family has asked to have changed, the waiting one first. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiReader();
    const parsed = familyRecordQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(recordChangesListSchema.parse(await familyRecordChanges(ctx, await whose(ctx, parsed.data.childId))));
  } catch (error) {
    return apiFailure(error, "api/v1/family/record/changes");
  }
}

/** POST /api/v1/family/record/changes?childId= — ask the office to change the record; asking again while one waits replaces it. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiReader();
    const query = familyRecordQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!query.success) return apiInvalid(query);
    const parsed = recordChangeFileSchema.safeParse((await readJson(request)) ?? {});
    if (!parsed.success) return apiInvalid(parsed);
    return ok(recordChangeSchema.parse(await fileRecordChange(ctx, await whose(ctx, query.data.childId), parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/family/record/changes");
  }
}
