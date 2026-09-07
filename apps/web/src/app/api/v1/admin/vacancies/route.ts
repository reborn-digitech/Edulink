import { adminVacanciesQuerySchema, adminVacanciesSchema, vacancyCreateBodySchema, vacancyCreatedSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { createPosting } from "@/lib/vacancies";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { adminVacancies, apiRefused } from "@/lib/api-reads/admin";

/** GET /api/v1/admin/vacancies — the school's own desk: what it is hiring for, with enquiry counts. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const parsed = adminVacanciesQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(adminVacanciesSchema.parse(await adminVacancies(ctx, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/vacancies");
  }
}

/** POST /api/v1/admin/vacancies — post a vacancy to the board. The hiring contact must be contactable staff of this school. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const parsed = vacancyCreateBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await createPosting(ctx, parsed.data);
    if (!result.ok) return apiRefused(result);
    return ok(vacancyCreatedSchema.parse({ postingId: result.postingId }), 201);
  } catch (error) {
    return apiFailure(error, "api/v1/admin/vacancies");
  }
}
