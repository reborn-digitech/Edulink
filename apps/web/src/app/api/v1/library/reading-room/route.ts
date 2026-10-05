import { readingRoomDaySchema, readingRoomQuerySchema, readingRoomScanSchema, readingRoomScannedSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { readingRoomDay, scanReader } from "@/lib/reading-room";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/library/reading-room?day= — the reading room's day report: every visit, who is inside, readers by kind, the average stay, the busiest hour. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("LIBRARIAN", "ADMIN", "PRINCIPAL");
    const parsed = readingRoomQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(readingRoomDaySchema.parse(await readingRoomDay(ctx, parsed.data.day)));
  } catch (error) {
    return moduleFailure(error, "api/v1/library/reading-room");
  }
}

/** POST /api/v1/library/reading-room — sign a reader in or out by card, student code or membership (one open visit per person). */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("LIBRARIAN", "ADMIN");
    const parsed = readingRoomScanSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(readingRoomScannedSchema.parse(await scanReader(ctx, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/library/reading-room");
  }
}
