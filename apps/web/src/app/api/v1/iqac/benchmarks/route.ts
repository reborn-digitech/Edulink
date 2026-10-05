import { benchmarksSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { benchmarksView } from "@/lib/iqac-benchmarks";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/iqac/benchmarks — the platform's NAAC benchmarks and NIRF bands, and whether the IQAC coordinator has signed them (G4-15). */
export async function GET() {
  try {
    const ctx = await requireApiRoles("IQAC", "ADMIN", "PRINCIPAL", "HOD");
    return ok(benchmarksSchema.parse(await benchmarksView(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/iqac/benchmarks");
  }
}
