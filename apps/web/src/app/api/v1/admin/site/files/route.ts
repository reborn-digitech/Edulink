import { siteFilesSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiFailure, ok } from "@/lib/api-v1";
import { siteFiles } from "@/lib/site-files";

/** GET /api/v1/admin/site/files — the pictures and PDFs uploaded for the website, newest first (website-two, 16 Oct 2026). Uploads go through the editor. */
export async function GET() {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const rows = await siteFiles(ctx);
    return ok(siteFilesSchema.parse({ files: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })) }));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/site/files");
  }
}
