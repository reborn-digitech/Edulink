import { badgeSaveSchema, badgeSavedSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { saveBadge } from "@/lib/attendance-devices";
import { moduleFailure } from "@/lib/rule-refusal";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/admin/attendance-devices/badges — The office maps a card or enrolment number to a person. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("ADMIN");
    const parsed = badgeSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(badgeSavedSchema.parse(await saveBadge(ctx, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/admin/attendance-devices/badges");
  }
}
