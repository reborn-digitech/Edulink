import { collegeFilingGenerateSchema, collegeFilingsSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { generateFiling, listFilings } from "@/lib/iqac-filings";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/iqac/filings — The filings generated, each with its fingerprint, status and figures. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("IQAC", "ADMIN", "PRINCIPAL");
    return ok(collegeFilingsSchema.parse(await listFilings(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/filings");
  }
}

/** POST /api/v1/iqac/filings — Generate a filing from the live records (SSR, AQAR, IIQA, NIRF, AISHE, the AICTE disclosure, the affiliation return). */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("IQAC", "ADMIN");
    const parsed = collegeFilingGenerateSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(collegeFilingsSchema.parse(await generateFiling(ctx, b)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/filings");
  }
}
