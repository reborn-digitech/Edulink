import { examActionResultSchema, examSessionSaveSchema, examSessionViewSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { sessionView, updateSession } from "@/lib/exam-cell";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ sessionId: string }> };

/** GET /api/v1/exam-cell/sessions/{sessionId} — One session: forms, date sheet, halls, invigilation, malpractice, remuneration, runs, grace, notes, marks status. */
export async function GET(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("EXAM_CONTROLLER", "ADMIN", "PRINCIPAL");
    const p = await params;
    return ok(examSessionViewSchema.parse(await sessionView(ctx, p.sessionId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/exam-cell/sessions/[sessionId]");
  }
}

/** POST /api/v1/exam-cell/sessions/{sessionId} — Rewrite a session while it is a draft or taking forms. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("EXAM_CONTROLLER");
    const p = await params;
    const parsed = examSessionSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(examActionResultSchema.parse(await updateSession(ctx, p.sessionId, b)));
  } catch (error) {
    return moduleFailure(error, "api/v1/exam-cell/sessions/[sessionId]");
  }
}
