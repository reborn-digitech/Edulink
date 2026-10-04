import { academicsChangedResultSchema, seatSaveSchema, seatsQuerySchema, seatsSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { listSeats, saveSeat } from "@/lib/academics";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/academics/students — Students' seats in programmes (an HOD's department), and who has none yet. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("ADMIN", "PRINCIPAL", "HOD");
    const parsed = seatsQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(seatsSchema.parse(await listSeats(ctx, q)));
  } catch (error) {
    return moduleFailure(error, "api/v1/academics/students");
  }
}

/** POST /api/v1/academics/students — A student's seat: programme, scheme, year, semester, division with roll number, PRN. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("ADMIN");
    const parsed = seatSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(academicsChangedResultSchema.parse(await saveSeat(ctx, q)));
  } catch (error) {
    return moduleFailure(error, "api/v1/academics/students");
  }
}
