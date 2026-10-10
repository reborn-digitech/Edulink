import { familyClinicalSchema } from "@edulink/contracts";
import { ok } from "@/lib/api-v1";
import { requireApiRole } from "@/lib/tenancy";
import { moduleFailure } from "@/lib/rule-refusal";
import { myClinical } from "@/lib/clinical";

/** GET /api/v1/family/clinical — a college student's own clinical postings and logbook (R-56, 10 Oct 2026); no guardian door. */
export async function GET() {
  try {
    const ctx = await requireApiRole("STUDENT");
    return ok(familyClinicalSchema.parse(await myClinical(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/family/clinical");
  }
}
