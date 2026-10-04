import { alumniMentorSlotSaveSchema, mentorSlotSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { offerMentorSlot } from "@/lib/placement-alumni";
import { moduleFailure } from "@/lib/rule-refusal";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/alumni/college/mentor-slots — A mentor offers a free one-to-one. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("ALUMNUS");
    const parsed = alumniMentorSlotSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(mentorSlotSchema.nullable().parse(await offerMentorSlot(ctx, b)));
  } catch (error) {
    return moduleFailure(error, "api/v1/alumni/college/mentor-slots");
  }
}
