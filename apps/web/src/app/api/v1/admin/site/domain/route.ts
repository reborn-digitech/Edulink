import { siteDomainConfirmBodySchema, siteDomainRemovedSchema, siteDomainSaveBodySchema, siteDomainViewSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { removeSiteDomain, saveSiteDomain, siteDomainView } from "@/lib/site-domains";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/**
 * The school's own domain for its public website (the WEBSITE module, website-builder B, 15 Oct 2026); the office
 * and the head. The catalog's `module: "WEBSITE"` answers 403 MODULE_OFF before these run while the module is off.
 */

/** GET /api/v1/admin/site/domain — whether the site is published, and the school's own domain (its only address) with its state and the records to add. */
export async function GET() {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    return ok(siteDomainViewSchema.parse(await siteDomainView(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/site/domain");
  }
}

/** POST /api/v1/admin/site/domain — save the school's own domain ({ domain }), replacing the one it had; audited. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const parsed = siteDomainSaveBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(siteDomainViewSchema.parse(await saveSiteDomain(ctx, parsed.data.domain)));
  } catch (error) {
    // Not a domain: 422 naming `domain`; another school's: 409 (QA-54).
    return moduleFailure(error, "api/v1/admin/site/domain");
  }
}

/** DELETE /api/v1/admin/site/domain — remove the school's own domain ({ domain }, the one shown); audited. */
export async function DELETE(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const parsed = siteDomainConfirmBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(siteDomainRemovedSchema.parse(await removeSiteDomain(ctx, parsed.data.domain)));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/site/domain");
  }
}
