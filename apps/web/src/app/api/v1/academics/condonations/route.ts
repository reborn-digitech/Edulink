import { condonationAskSchema, condonationSchema, condonationsQuerySchema, condonationsSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { askCondonation, listCondonations } from "@/lib/academics-attendance";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/academics/condonations — Condonation asks: a student's own, an HOD's department's, what was forwarded to the principal, all for the office. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("STUDENT", "HOD", "PRINCIPAL", "ADMIN");
    const parsed = condonationsQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(condonationsSchema.parse(await listCondonations(ctx, q.status ?? "OPEN")));
  } catch (error) {
    return moduleFailure(error, "api/v1/academics/condonations");
  }
}

/** POST /api/v1/academics/condonations — A student asks for a shortfall to be condoned, with a ground and an optional document (an upload ticket). */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("STUDENT");
    const parsed = condonationAskSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(condonationSchema.parse(await askCondonation(ctx, q)));
  } catch (error) {
    return moduleFailure(error, "api/v1/academics/condonations");
  }
}
