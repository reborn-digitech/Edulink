import { schoolTermCreateBodySchema, schoolTermCreatedSchema } from "@edulink/contracts";
import { AccessError, requireApiRole } from "@/lib/tenancy";
import { createTerm } from "@/lib/terms";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { apiRefused } from "@/lib/api-reads/admin";

/**
 * POST /api/v1/admin/calendar/years/{yearId}/terms — make a term inside a
 * school's year (the web's addTerm; a college's terms are POST
 * /api/v1/academics/terms). The office and the head. A term outside the
 * year's dates, overlapping a sibling or named like one is a 422 in words; a
 * year of another school is a 404.
 */
export async function POST(request: Request, { params }: { params: Promise<{ yearId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const { yearId } = await params;
    const parsed = schoolTermCreateBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await createTerm(ctx, yearId, parsed.data);
    if (!result.ok) {
      if (result.errorKey === "access.academicYearNotFound") throw new AccessError(result.errorKey, "NOT_FOUND");
      return apiRefused(result);
    }
    return ok(schoolTermCreatedSchema.parse({ termId: result.termId }));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/calendar/years/[yearId]/terms");
  }
}
