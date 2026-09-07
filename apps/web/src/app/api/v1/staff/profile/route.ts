import { NextResponse } from "next/server";
import { apiErrorSchema, saveProfileSchema, staffProfileSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { saveStaffProfile, staffProfile } from "@/lib/api-reads/staff";
import { getT } from "@/lib/i18n/server";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/staff/profile — the teacher's own profile page: the numbers, the editable fields, the review aggregate, the staff record. */
export async function GET() {
  try {
    const ctx = await requireApiRole("TEACHER");
    return ok(staffProfileSchema.parse(await staffProfile(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/staff/profile");
  }
}

/**
 * POST /api/v1/staff/profile — the teacher's own preferred name, bio, avatar
 * and (for staff, always) date of birth. Scoped to the signed-in user, so
 * there is no id to forge; the legal name stays with the office. Sending the
 * same body twice leaves the same profile.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("TEACHER");
    const parsed = saveProfileSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await saveStaffProfile(ctx, parsed.data);
    if (!result.ok) {
      const t = await getT();
      const issues: Record<string, string> = {};
      for (const [field, key] of Object.entries(result.issues)) if (key) issues[field] = t(key);
      return NextResponse.json(apiErrorSchema.parse({ error: t("common.checkTheForm"), code: "BAD_REQUEST", issues }), { status: 422, headers: { "Cache-Control": "no-store" } });
    }
    return ok({ ok: true });
  } catch (error) {
    return apiFailure(error, "api/v1/staff/profile");
  }
}
