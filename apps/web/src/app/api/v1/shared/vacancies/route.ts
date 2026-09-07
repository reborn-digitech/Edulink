import { vacanciesBoardSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { listBoard } from "@/lib/vacancies";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/shared/vacancies — the platform-wide board of open vacancies, for school staff. */
export async function GET() {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN", "PRINCIPAL");
    const items = (await listBoard(ctx)).map((p) => ({ ...p, createdAt: p.createdAt.toISOString() }));
    return ok(vacanciesBoardSchema.parse({ items }));
  } catch (error) {
    return apiFailure(error, "api/v1/shared/vacancies");
  }
}
