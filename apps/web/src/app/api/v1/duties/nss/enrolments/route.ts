import { corpsEnrolSchema, streamRecordsCountSchema } from "@edulink/contracts";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { requireApiRoles } from "@/lib/api-roles";
import { moduleFailure } from "@/lib/rule-refusal";
import { enrolInCorps } from "@/lib/corps";

/** POST /api/v1/duties/nss/enrolments — students enrolled in the NSS unit (audited duties.corps.enrol). */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("ADMIN", "FACULTY", "HOD");
    const parsed = corpsEnrolSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(streamRecordsCountSchema.parse(await enrolInCorps(ctx, "NSS", parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/duties/nss/enrolments");
  }
}
