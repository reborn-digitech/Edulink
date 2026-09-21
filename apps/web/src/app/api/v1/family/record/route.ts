import { familyRecordQuerySchema, pupilRecordSaveSchema, pupilRecordViewSchema } from "@edulink/contracts";
import { requireApiReader, selectChild } from "@/lib/api-reads/family";
import { pupilRecordFor, savePupilRecord } from "@/lib/pupil-records";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import type { ActiveContext } from "@/lib/session";

async function whose(ctx: ActiveContext & { role: "STUDENT" | "PARENT" }, childId?: string): Promise<string> {
  if (ctx.role === "STUDENT") return ctx.membershipId!;
  return (await selectChild(ctx, childId)).selectedId;
}

/** GET /api/v1/family/record?childId= — the record, with what is still blank. */
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

/** POST /api/v1/family/record?childId= — the family fills it in. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiReader();
    const query = familyRecordQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!query.success) return apiInvalid(query);
    const parsed = pupilRecordSaveSchema.safeParse((await readJson(request)) ?? {});
    if (!parsed.success) return apiInvalid(parsed);
    return ok(pupilRecordViewSchema.parse(await savePupilRecord(ctx, await whose(ctx, query.data.childId), parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/family/record");
  }
}
