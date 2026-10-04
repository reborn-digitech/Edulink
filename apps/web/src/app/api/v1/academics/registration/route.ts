import { registrationQuerySchema, registrationSaveSchema, registrationViewSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { registrationView, saveRegistration } from "@/lib/academics-registration";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/academics/registration — A student's course registration for a term: the window, credits, offerings to choose, exit points. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("STUDENT", "ADMIN");
    const parsed = registrationQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(registrationViewSchema.parse(await registrationView(ctx, q)));
  } catch (error) {
    return moduleFailure(error, "api/v1/academics/registration");
  }
}

/** POST /api/v1/academics/registration — Register on a set of offerings within the window and the scheme's credits (the office on a student's behalf). */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("STUDENT", "ADMIN");
    const parsed = registrationSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(registrationViewSchema.parse(await saveRegistration(ctx, q)));
  } catch (error) {
    return moduleFailure(error, "api/v1/academics/registration");
  }
}
