import { competitionEventBodySchema, competitionEventRemovedSchema, okSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { removeCompetitionEvent, updateCompetitionEvent } from "@/lib/competition-events";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { underRules } from "@/lib/api-rule-failure";

/** POST /api/v1/admin/calendar/competitions/{holidayId} — edit the event and its competition in step, every field sent as the add takes them. Another school's row is a 404. */
export async function POST(request: Request, { params }: { params: Promise<{ holidayId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { holidayId } = await params;
    const parsed = competitionEventBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return await underRules("api/v1/admin/calendar/competitions/[holidayId]", async () => {
      await updateCompetitionEvent(ctx, holidayId, parsed.data);
      return ok(okSchema.parse({ ok: true }));
    });
  } catch (error) {
    return apiFailure(error, "api/v1/admin/calendar/competitions/[holidayId]");
  }
}

/** DELETE /api/v1/admin/calendar/competitions/{holidayId} — take the event off the calendar: the competition is deleted while nobody has entered, archived otherwise. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ holidayId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { holidayId } = await params;
    return await underRules("api/v1/admin/calendar/competitions/[holidayId]", async () => ok(competitionEventRemovedSchema.parse({ ok: true, competition: await removeCompetitionEvent(ctx, holidayId) })));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/calendar/competitions/[holidayId]");
  }
}
