import { recordRequestSchema, recordRequestedSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { requestRecords } from "@/lib/pupil-records";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/office/pupil-records/request — ask the families to fill what is blank. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const parsed = recordRequestSchema.safeParse((await readJson(request)) ?? {});
    if (!parsed.success) return apiInvalid(parsed);
    return ok(recordRequestedSchema.parse(await requestRecords(ctx, parsed.data.membershipIds)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/pupil-records/request");
  }
}
