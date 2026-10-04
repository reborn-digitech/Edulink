import { studentLedgerQuerySchema, studentScholarshipsSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { myScholarships } from "@/lib/scholarships";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/student/scholarships — The student's own claims and the schemes they qualify for; a guardian's read needs the MONEY grant for an adult. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("STUDENT", "PARENT");
    const parsed = studentLedgerQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(studentScholarshipsSchema.parse(await myScholarships(ctx, q.childId)));
  } catch (error) {
    return apiFailure(error, "api/v1/student/scholarships");
  }
}
