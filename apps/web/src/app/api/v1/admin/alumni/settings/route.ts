import { alumniSettingsResultSchema, alumniSettingsSchema } from "@edulink/contracts";
import { setAlumniFeedMode } from "@/lib/alumni";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { requireApiRole } from "@/lib/tenancy";

/** POST /api/v1/admin/alumni/settings — what alumni may do on the feed (the admin's; audited alumni.settings). */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = alumniSettingsSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(alumniSettingsResultSchema.parse(await setAlumniFeedMode(ctx, parsed.data.feedMode)));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/alumni/settings");
  }
}
