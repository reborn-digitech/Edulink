import { adminSettingsSchema, schoolDetailsBodySchema, okSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { adminSettings, apiRefused } from "@/lib/api-reads/admin";
import { saveSchoolDetails } from "@/app/(app)/admin/settings/actions";

/** GET /api/v1/admin/settings — the school's details, its directory profile, and the notification housekeeping thresholds. */
export async function GET() {
  try {
    const ctx = await requireApiRole("ADMIN");
    return ok(adminSettingsSchema.parse(await adminSettings(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/settings");
  }
}

/** POST /api/v1/admin/settings — save the school's details. The action re-validates and answers field by field. */
export async function POST(request: Request) {
  try {
    await requireApiRole("ADMIN");
    const parsed = schoolDetailsBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const state = await saveSchoolDetails(parsed.data);
    if (!state.ok) return apiRefused({ issues: state.errors });
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/settings");
  }
}
