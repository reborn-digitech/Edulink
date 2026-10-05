import { benchmarksSchema, benchmarksSignSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { signBenchmarks } from "@/lib/iqac-benchmarks";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/iqac/benchmarks/sign — the IQAC coordinator signs the list they read; the figures stop reading provisional (G4-15). */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("IQAC");
    const parsed = benchmarksSignSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(benchmarksSchema.parse(await signBenchmarks(ctx, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/iqac/benchmarks/sign");
  }
}
