import { corpsActivitySaveSchema, streamRecordsIdSchema } from "@edulink/contracts";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { requireApiRoles } from "@/lib/api-roles";
import { moduleFailure } from "@/lib/rule-refusal";
import { addCorpsActivity } from "@/lib/corps";

/** POST /api/v1/duties/nss/activities — an activity of the NSS unit with its hours and enrolled participants, written to the IQAC register (audited duties.corps.activity). */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("ADMIN", "FACULTY", "HOD");
    const parsed = corpsActivitySaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(streamRecordsIdSchema.parse(await addCorpsActivity(ctx, "NSS", parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/duties/nss/activities");
  }
}
