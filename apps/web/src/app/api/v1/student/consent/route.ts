import { studentConsentSchema, studentConsentSetSchema } from "@edulink/contracts";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { requireApiRole } from "@/lib/tenancy";
import { myStudentConsent, setStudentConsent } from "@/lib/student-consent";
import type { ActiveContext } from "@/lib/session";

async function body(ctx: ActiveContext) {
  const view = await myStudentConsent(ctx);
  return studentConsentSchema.parse({ ...view, grants: view.grants.map((g) => ({ ...g, grantedAt: g.grantedAt?.toISOString() ?? null })) });
}

/** GET /api/v1/student/consent — what this student lets their guardians see (4 Oct 2026); `applies` is false for a minor or a pupil at a school. */
export async function GET() {
  try {
    const ctx = await requireApiRole("STUDENT");
    return ok(await body(ctx));
  } catch (error) {
    return apiFailure(error, "api/v1/student/consent");
  }
}

/** POST /api/v1/student/consent — grant or revoke one; an adult at a college alone (audited student.consent.grant|revoke). */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("STUDENT");
    const parsed = studentConsentSetSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    await setStudentConsent(ctx, parsed.data.grant, parsed.data.on);
    return ok(await body(ctx));
  } catch (error) {
    return apiFailure(error, "api/v1/student/consent");
  }
}
