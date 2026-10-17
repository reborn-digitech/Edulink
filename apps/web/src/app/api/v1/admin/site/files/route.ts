import { siteFilesSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiFailure, ok } from "@/lib/api-v1";
import { siteFiles, SITE_FILES_MAX } from "@/lib/site-files";

/**
 * GET /api/v1/admin/site/files — the pictures and PDFs uploaded for the website, newest first (website-two, 16 Oct 2026).
 * Uploads go through the editor. website-three (17 Oct 2026): each with where the saved draft and the live site use it, and
 * the count against the most a site keeps.
 */
export async function GET() {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const rows = await siteFiles(ctx);
    return ok(siteFilesSchema.parse({ files: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })), count: rows.length, max: SITE_FILES_MAX }));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/site/files");
  }
}
