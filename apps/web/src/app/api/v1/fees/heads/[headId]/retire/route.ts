import { feeHeadRetireSchema, feeOkSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { retireHead } from "@/lib/fees";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/fees/heads/{headId}/retire — take a head out of the picker (restore: true brings it back). Lines already using it are untouched. */
export async function POST(request: Request, { params }: { params: Promise<{ headId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "ACCOUNTS");
    const { headId } = await params;
    const parsed = feeHeadRetireSchema.safeParse((await readJson(request)) ?? {});
    if (!parsed.success) return apiInvalid(parsed);
    await retireHead(ctx, headId, Boolean(parsed.data.restore));
    return ok(feeOkSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/fees/heads/[headId]/retire");
  }
}
