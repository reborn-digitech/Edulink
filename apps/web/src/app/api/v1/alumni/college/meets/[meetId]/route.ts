import { alumniMeetGoingSchema, alumniMeetViewSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { registerForMeet } from "@/lib/placement-alumni";
import { moduleFailure } from "@/lib/rule-refusal";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";

type Params = { params: Promise<{ meetId: string }> };

/** POST /api/v1/alumni/college/meets/{meetId} — Register for a meet, or cancel. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("ALUMNUS");
    const p = await params;
    const parsed = alumniMeetGoingSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(alumniMeetViewSchema.nullable().parse(await registerForMeet(ctx, p.meetId, b.going)));
  } catch (error) {
    return moduleFailure(error, "api/v1/alumni/college/meets/[meetId]");
  }
}
