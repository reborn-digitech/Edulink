import { collegeConcessionBodySchema, collegeConcessionResultSchema, pendingConcessionsSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { grantCollegeConcession, pendingConcessions } from "@/lib/college-fees";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/accounts/concessions — Concessions waiting for the principal. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("ACCOUNTS", "ADMIN", "PRINCIPAL");
    return ok(pendingConcessionsSchema.parse(await pendingConcessions(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/accounts/concessions");
  }
}

/** POST /api/v1/accounts/concessions — A concession with the sanctioning authority named; above the office's limit it waits for the principal and is not applied. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("ACCOUNTS", "ADMIN");
    const parsed = collegeConcessionBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(collegeConcessionResultSchema.parse(await grantCollegeConcession(ctx, b)));
  } catch (error) {
    return apiFailure(error, "api/v1/accounts/concessions");
  }
}
