import { alumniFlagResultSchema, alumniMuteSchema } from "@edulink/contracts";
import { setAlumnusMuted } from "@/lib/alumni";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { requireApiRole } from "@/lib/tenancy";

/** POST /api/v1/admin/alumni/mute — pause an alumnus's messages and comments, or restore them (audited; they are told). */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = alumniMuteSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(alumniFlagResultSchema.parse(await setAlumnusMuted(ctx, parsed.data.membershipId, parsed.data.muted, parsed.data.reason)));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/alumni/mute");
  }
}
