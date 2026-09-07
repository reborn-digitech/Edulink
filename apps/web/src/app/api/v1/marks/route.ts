import { NextResponse } from "next/server";
import { marksBatchSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { saveMarks } from "@/lib/exams";
import { apiFailure, apiInvalid, readJson } from "@/lib/api-v1";

/**
 * POST /api/v1/marks — one sheet of marks for one exam slot in one class.
 *
 * The offline outbox's second write path (attendance was the first). Safe to
 * replay because saveMarks stores the batch as the sheet's current state; the
 * same body twice leaves the same marks. The rule about WHO may enter marks —
 * the class teacher, or the teacher timetabled for the subject, or the office —
 * is assertMayEnterMarks inside saveMarks, the same as the form's action.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN");
    const parsed = marksBatchSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const { slotId, classId, entries } = parsed.data;
    const result = await saveMarks(ctx, slotId, classId, entries);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiFailure(error, "api/v1/marks");
  }
}
