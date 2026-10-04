import { examMarksEntryResultSchema, examMarksEntrySchema, examMarksQuerySchema, examMarksSheetSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { enterMarks, marksSheet } from "@/lib/exam-cell-marks";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ sessionId: string }> };

/** GET /api/v1/exam-cell/sessions/{sessionId}/marks — One course's marks sheet: internal (locked), both entries, the standing mark, grace. */
export async function GET(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("EXAM_CONTROLLER", "ADMIN", "PRINCIPAL");
    const p = await params;
    const parsed = examMarksQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(examMarksSheetSchema.parse(await marksSheet(ctx, p.sessionId, q.courseId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/exam-cell/sessions/[sessionId]/marks");
  }
}

/** POST /api/v1/exam-cell/sessions/{sessionId}/marks — One person's entry of a course's external marks; two people must agree. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("EXAM_CONTROLLER", "ADMIN");
    const p = await params;
    const parsed = examMarksEntrySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(examMarksEntryResultSchema.parse(await enterMarks(ctx, p.sessionId, b)));
  } catch (error) {
    return moduleFailure(error, "api/v1/exam-cell/sessions/[sessionId]/marks");
  }
}
