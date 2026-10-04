import { offeringSaveSchema, offeringSchema, offeringsQuerySchema, offeringsSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { listOfferings, saveOffering } from "@/lib/academics";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/academics/offerings — A term's course offerings, each faculty member's weekly load against the band, students per faculty member by department. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("ADMIN", "PRINCIPAL", "HOD", "FACULTY");
    const parsed = offeringsQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(offeringsSchema.parse(await listOfferings(ctx, q)));
  } catch (error) {
    return moduleFailure(error, "api/v1/academics/offerings");
  }
}

/** POST /api/v1/academics/offerings — An offering made or changed: course, division or shared, faculty, weekly hours, room (an HOD in their department). */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("ADMIN", "HOD");
    const parsed = offeringSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(offeringSchema.parse(await saveOffering(ctx, q)));
  } catch (error) {
    return moduleFailure(error, "api/v1/academics/offerings");
  }
}
