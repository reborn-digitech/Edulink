import { adminExamsQuerySchema, adminExamsSchema, examSeriesCreateBodySchema, examSeriesCreatedSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { createSeries } from "@/lib/exams";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { adminExams } from "@/lib/api-reads/admin";

/** GET /api/v1/admin/exams — every live exam series with its papers, filtered the way the page filters. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = adminExamsQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(adminExamsSchema.parse(await adminExams(ctx, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/exams");
  }
}

/** POST /api/v1/admin/exams — schedule a series. Same name and grade as a live one is refused; the term, if named, must be this school's. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = examSeriesCreateBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const seriesId = await createSeries(ctx, parsed.data);
    return ok(examSeriesCreatedSchema.parse({ seriesId }), 201);
  } catch (error) {
    return apiFailure(error, "api/v1/admin/exams");
  }
}
