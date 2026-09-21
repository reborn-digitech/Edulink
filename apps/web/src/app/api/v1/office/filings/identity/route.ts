import { filingIdentitySaveSchema, filingsViewSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { saveFilingIdentity } from "@/lib/filings";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/office/filings/identity — what the portals know the school as. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = filingIdentitySaveSchema.safeParse((await readJson(request)) ?? {});
    if (!parsed.success) return apiInvalid(parsed);
    return ok(filingsViewSchema.parse(await saveFilingIdentity(ctx, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/filings/identity");
  }
}
