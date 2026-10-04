import { feeStructureBodySchema, feeStructureCreatedSchema, feeStructuresQuerySchema, feeStructuresSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { createStructure } from "@/lib/fees";
import { feesStructuresRead } from "@/lib/api-reads/fees";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/fees/structures — the year's structures with totals and pupil counts. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL", "ACCOUNTS");
    const parsed = feeStructuresQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(feeStructuresSchema.parse(await feesStructuresRead(ctx, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/fees/structures");
  }
}

/** POST /api/v1/fees/structures — a draft structure: instalments, each with head lines in paise. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "ACCOUNTS");
    const parsed = feeStructureBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const { gradeLevel, ...rest } = parsed.data;
    return ok(feeStructureCreatedSchema.parse({ id: await createStructure(ctx, { ...rest, gradeLevel: gradeLevel ?? null }) }), 201);
  } catch (error) {
    return apiFailure(error, "api/v1/fees/structures");
  }
}
