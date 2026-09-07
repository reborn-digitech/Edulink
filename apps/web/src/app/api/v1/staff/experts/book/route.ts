import { bookExpertSchema, expertBookedSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { bookSlot } from "@/lib/experts";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/staff/experts/book — book an expert's open slot for this school. Who may, and whether the slot is still free, is bookSlot's. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "TEACHER");
    const parsed = bookExpertSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await bookSlot(ctx, parsed.data.slotId, parsed.data.topic);
    return ok(expertBookedSchema.parse(result));
  } catch (error) {
    return apiFailure(error, "api/v1/staff/experts/book");
  }
}
