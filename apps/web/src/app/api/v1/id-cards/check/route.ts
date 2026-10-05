import { idCardCheckQuerySchema, idCardCheckSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { checkIdCode } from "@/lib/id-card";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/id-cards/check?c= — a scanned card's student at the checker's own school, as the school holds them now (5 Oct 2026). */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("ADMIN", "PRINCIPAL", "TEACHER", "FACULTY", "HOD", "WARDEN", "LIBRARIAN", "DRIVER");
    const parsed = idCardCheckQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(idCardCheckSchema.parse(await checkIdCode(ctx, parsed.data.c)));
  } catch (error) {
    return apiFailure(error, "api/v1/id-cards/check");
  }
}
