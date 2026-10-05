import { practicalSignSchema, streamRecordsCountSchema } from "@edulink/contracts";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { requireApiRoles } from "@/lib/api-roles";
import { moduleFailure } from "@/lib/rule-refusal";
import { signPracticals } from "@/lib/stream-records";

/** POST /api/v1/stream-records/practicals/sign — the offering's teacher, its HOD or a lab in-charge signs practical-record rows (audited streamRecords.practical.sign). */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("FACULTY", "HOD");
    const parsed = practicalSignSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(streamRecordsCountSchema.parse(await signPracticals(ctx, parsed.data.recordIds)));
  } catch (error) {
    return moduleFailure(error, "api/v1/stream-records/practicals/sign");
  }
}
