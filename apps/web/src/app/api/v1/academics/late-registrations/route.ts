import { academicsIdResultSchema, lateRegistrationAskSchema, lateRegistrationsSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { askLateRegistration, listLateRegistrations } from "@/lib/academics-registration";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/academics/late-registrations — Late registrations asked by the office and decided by the principal. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("ADMIN", "PRINCIPAL");
    return ok(lateRegistrationsSchema.parse(await listLateRegistrations(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/academics/late-registrations");
  }
}

/** POST /api/v1/academics/late-registrations — The office asks to open a student's registration after the window. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("ADMIN");
    const parsed = lateRegistrationAskSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(academicsIdResultSchema.parse(await askLateRegistration(ctx, q)));
  } catch (error) {
    return moduleFailure(error, "api/v1/academics/late-registrations");
  }
}
