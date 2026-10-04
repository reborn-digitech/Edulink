import { collegeFilingsSchema, filingFiledSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { markFiled } from "@/lib/iqac-filings";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** POST /api/v1/iqac/filings/{filingId}/filed — Mark a filing as filed on the portal, with the acknowledgement if there is one. */
export async function POST(request: Request, { params }: { params: Promise<{ filingId: string }> }) {
  try {
    const ctx = await requireApiRoles("IQAC", "ADMIN");
    const p = await params;
    const parsed = filingFiledSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(collegeFilingsSchema.parse(await markFiled(ctx, p.filingId, b.fileId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/filings/[filingId]/filed");
  }
}
