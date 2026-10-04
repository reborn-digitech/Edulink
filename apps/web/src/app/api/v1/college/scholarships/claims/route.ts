import { scholarshipClaimCreateSchema, scholarshipClaimSchema, scholarshipClaimsQuerySchema, scholarshipClaimsSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { createClaim, listClaims } from "@/lib/scholarships";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/college/scholarships/claims — Scholarship claims by status, year and scheme, with what the state still owes and for how long. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("ACCOUNTS", "ADMIN", "PRINCIPAL");
    const parsed = scholarshipClaimsQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(scholarshipClaimsSchema.parse(await listClaims(ctx, q)));
  } catch (error) {
    return apiFailure(error, "api/v1/college/scholarships/claims");
  }
}

/** POST /api/v1/college/scholarships/claims — Record a claim filed on the portal; the same student, scheme and year again is the same claim. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("ACCOUNTS", "ADMIN");
    const parsed = scholarshipClaimCreateSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(scholarshipClaimSchema.parse(await createClaim(ctx, b)));
  } catch (error) {
    return apiFailure(error, "api/v1/college/scholarships/claims");
  }
}
