import { practicalSaveSchema, practicalSheetSchema, practicalsQuerySchema, streamRecordsCountSchema } from "@edulink/contracts";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { requireApiRoles } from "@/lib/api-roles";
import { moduleFailure } from "@/lib/rule-refusal";
import { practicalSheet, savePracticals } from "@/lib/stream-records";

/** GET /api/v1/stream-records/practicals — the offerings with practicals the caller may keep or read a record on, and one offering's students and record. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("FACULTY", "HOD", "ADMIN", "PRINCIPAL");
    const parsed = practicalsQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(practicalSheetSchema.parse(await practicalSheet(ctx, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/stream-records/practicals");
  }
}

/** POST /api/v1/stream-records/practicals — one experiment for some of an offering's students, by its teacher or its department's HOD; a signed row is a 409 (audited streamRecords.practical.save). */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("FACULTY", "HOD");
    const parsed = practicalSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(streamRecordsCountSchema.parse(await savePracticals(ctx, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/stream-records/practicals");
  }
}
