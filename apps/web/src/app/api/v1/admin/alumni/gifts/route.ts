import { alumniGiftSaveSchema, alumniGiftViewSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { recordGift } from "@/lib/placement-alumni";
import { moduleFailure } from "@/lib/rule-refusal";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/admin/alumni/gifts — The office records a gift. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("ADMIN");
    const parsed = alumniGiftSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(alumniGiftViewSchema.parse(await recordGift(ctx, b)));
  } catch (error) {
    return moduleFailure(error, "api/v1/admin/alumni/gifts");
  }
}
