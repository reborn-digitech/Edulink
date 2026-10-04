import { feeHeadSaveSchema, feeHeadSavedSchema, feeHeadsSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { saveHead } from "@/lib/fees";
import { feesHeadsRead } from "@/lib/api-reads/fees";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/fees/heads — the fee heads, retired ones included and marked. */
export async function GET() {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL", "ACCOUNTS");
    return ok(feeHeadsSchema.parse(await feesHeadsRead(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/fees/heads");
  }
}

/** POST /api/v1/fees/heads — add a head, or rename one by id. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "ACCOUNTS");
    const parsed = feeHeadSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(feeHeadSavedSchema.parse({ id: await saveHead(ctx, parsed.data) }), parsed.data.id ? 200 : 201);
  } catch (error) {
    return apiFailure(error, "api/v1/fees/heads");
  }
}
