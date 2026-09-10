import { officeLogoBodySchema, officeLogoSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { adoptLogoUpload, removeSchoolLogo } from "@/lib/school-logo";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { apiRefused } from "@/lib/api-reads/admin";

/**
 * POST /api/v1/office/logo — make a file this admin uploaded (POST
 * /api/v1/uploads) the school's logo, or take the logo off with
 * `fileId: null`. An image only, 2 MB at most; the upload ticket is spent,
 * and another person's file id is a 404.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = officeLogoBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    if (parsed.data.fileId === null) {
      await removeSchoolLogo(ctx);
      return ok(officeLogoSchema.parse({ logoPath: null }));
    }
    const result = await adoptLogoUpload(ctx, parsed.data.fileId);
    if (!result.ok) return apiRefused(result);
    return ok(officeLogoSchema.parse({ logoPath: result.logoPath }));
  } catch (error) {
    return apiFailure(error, "api/v1/office/logo");
  }
}
