import { admitSchema, admittedSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { admit } from "@/lib/admissions";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/office/admissions/applications/{applicationId}/admit — give the seat. */
export async function POST(request: Request, { params }: { params: Promise<{ applicationId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const { applicationId } = await params;
    const parsed = admitSchema.safeParse((await readJson(request)) ?? {});
    if (!parsed.success) return apiInvalid(parsed);
    return ok(admittedSchema.parse(await admit(ctx, applicationId, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/admissions/applications/[applicationId]/admit");
  }
}
