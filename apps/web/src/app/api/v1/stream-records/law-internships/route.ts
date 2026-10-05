import { lawInternshipSummarySchema, lawInternshipsQuerySchema } from "@edulink/contracts";
import { apiInvalid, ok } from "@/lib/api-v1";
import { requireApiRoles } from "@/lib/api-roles";
import { moduleFailure } from "@/lib/rule-refusal";
import { lawInternships } from "@/lib/stream-records";

/** GET /api/v1/stream-records/law-internships — the BCI's internship weeks per law student and the year's moots. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("ADMIN", "PRINCIPAL", "HOD", "TPO");
    const parsed = lawInternshipsQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(lawInternshipSummarySchema.parse(await lawInternships(ctx, parsed.data.year)));
  } catch (error) {
    return moduleFailure(error, "api/v1/stream-records/law-internships");
  }
}
