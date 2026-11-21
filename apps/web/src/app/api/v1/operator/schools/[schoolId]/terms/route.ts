import { schoolTermsSchema, termsBodySchema, termsChangeSchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { readSchoolTerms, setSchoolTerms } from "@/lib/school-terms";
import { operatorRefused } from "@/lib/api-reads/operator-school";

/** GET /api/v1/operator/schools/{schoolId}/terms — the school's subscription and premium terms, worked out on read, with its standing and the year's bill. */
export async function GET(_request: Request, { params }: { params: Promise<{ schoolId: string }> }) {
  try {
    const ctx = await requireApiOperator();
    const { schoolId } = await params;
    const result = await readSchoolTerms(ctx, schoolId);
    if ("ok" in result) return operatorRefused(result);
    return ok(schoolTermsSchema.parse(result));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/schools/[schoolId]/terms");
  }
}

/** PUT /api/v1/operator/schools/{schoolId}/terms — change the school's own terms, premium switches or note against the terms as read; `preview` writes nothing. */
export async function PUT(request: Request, { params }: { params: Promise<{ schoolId: string }> }) {
  try {
    const ctx = await requireApiOperator();
    const { schoolId } = await params;
    const parsed = termsBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await setSchoolTerms(ctx, schoolId, parsed.data);
    if ("ok" in result) return operatorRefused(result);
    return ok(termsChangeSchema.parse(result));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/schools/[schoolId]/terms");
  }
}
