import { applicationSchema, testResultSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { recordTest } from "@/lib/admissions";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/office/admissions/applications/{applicationId}/test — record the entrance-test result. */
export async function POST(request: Request, { params }: { params: Promise<{ applicationId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const { applicationId } = await params;
    const parsed = testResultSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(applicationSchema.parse(await recordTest(ctx, applicationId, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/admissions/applications/[applicationId]/test");
  }
}
