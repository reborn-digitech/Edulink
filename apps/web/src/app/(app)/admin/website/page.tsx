import { redirect } from "next/navigation";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";

/**
 * /admin/website opens the flow where the office left it (website-builder A, 15 Oct 2026): a site never
 * published starts at the first screen, Look; a published one opens on Publish, which says where it lives.
 * The module-off answer is the layout's.
 */
export default async function WebsitePage() {
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const published = (await db.schoolSiteVersion.count({ where: { schoolId: ctx.schoolId } })) > 0;
  redirect(published ? "/admin/website/publish" : "/admin/website/look");
}
