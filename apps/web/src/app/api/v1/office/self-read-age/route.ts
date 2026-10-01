import { selfReadAgeSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { selfReadAgeOf, setSelfReadAge } from "@/lib/self-read";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/office/self-read-age — from what age a pupil may read their own health card and incidents (null: never). */
export async function GET() {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    return ok(selfReadAgeSchema.parse(await selfReadAgeOf(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/self-read-age");
  }
}

/** POST /api/v1/office/self-read-age — the office sets it. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = selfReadAgeSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(selfReadAgeSchema.parse(await setSelfReadAge(ctx, parsed.data.selfReadAge)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/self-read-age");
  }
}
