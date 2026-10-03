import { libraryFineCreateSchema, libraryFineSchema, libraryFinesQuerySchema, libraryFinesSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { listFines, raiseFine } from "@/lib/library";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/library/fines — Fines: those still due, or all. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("LIBRARIAN", "ADMIN", "PRINCIPAL");
    const parsed = libraryFinesQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(libraryFinesSchema.parse(await listFines(ctx, q.status)));
  } catch (error) {
    return apiFailure(error, "api/v1/library/fines");
  }
}

/** POST /api/v1/library/fines — A fine for a damaged or lost book. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("LIBRARIAN", "ADMIN");
    const parsed = libraryFineCreateSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(libraryFineSchema.parse(await raiseFine(ctx, b)));
  } catch (error) {
    return apiFailure(error, "api/v1/library/fines");
  }
}
