import { siteShareCreateSchema, siteShareMadeSchema, siteSharesSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { createSiteShare, siteShares } from "@/lib/site-share";

/** GET /api/v1/admin/site/shares — the review links still open, never their tokens (website-two, 16 Oct 2026). */
export async function GET() {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const rows = await siteShares(ctx);
    return ok(siteSharesSchema.parse({ shares: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString(), expiresAt: r.expiresAt.toISOString() })) }));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/site/shares");
  }
}

/** POST /api/v1/admin/site/shares — a review link to the draft ({ days: 1–7 }), revoking the one before; the URL is shown this once; audited. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const parsed = siteShareCreateSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const made = await createSiteShare(ctx, parsed.data.days);
    return ok(siteShareMadeSchema.parse({ ...made, expiresAt: made.expiresAt.toISOString() }), 201);
  } catch (error) {
    return apiFailure(error, "api/v1/admin/site/shares");
  }
}
