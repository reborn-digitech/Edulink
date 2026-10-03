import { messMenuQuerySchema, messMenuSaveSchema, messMenuSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { messMenu, saveMessMenu } from "@/lib/hostel";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/hostel/menu — The mess menu: every house's for staff, the boarder's own for the family. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("WARDEN", "ADMIN", "PRINCIPAL", "STUDENT", "PARENT");
    const parsed = messMenuQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(messMenuSchema.parse(await messMenu(ctx, q)));
  } catch (error) {
    return apiFailure(error, "api/v1/hostel/menu");
  }
}

/** POST /api/v1/hostel/menu — A house's week of meals. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("WARDEN", "ADMIN");
    const parsed = messMenuSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(messMenuSchema.parse(await saveMessMenu(ctx, b)));
  } catch (error) {
    return apiFailure(error, "api/v1/hostel/menu");
  }
}
