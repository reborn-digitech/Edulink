import { familyAgendaQuerySchema, familyAgendaSchema } from "@edulink/contracts";
import { requireApiReader } from "@/lib/api-reads/family";
import { familyAgenda } from "@/lib/agenda";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";
import { query } from "../_shared";

/** GET /api/v1/family/agenda?student=&days=14 — the next fortnight for the pupil, or for a guardian's child: exams, work due, sessions, meetings, closures and fee dates, in date order with a link each. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiReader();
    const parsed = familyAgendaQuerySchema.safeParse(query(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(familyAgendaSchema.parse(await familyAgenda(ctx, { student: parsed.data.student ?? parsed.data.childId, days: parsed.data.days })));
  } catch (error) {
    return apiFailure(error, "api/v1/family/agenda");
  }
}
