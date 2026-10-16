import "server-only";
import { requireRole } from "@/lib/tenancy";
import { isModuleOn } from "@/lib/modules";

/**
 * THE WEBSITE PAGES' EARLY RETURN (website-two, 16 October 2026). Next renders a page beside its layout whether or not
 * the layout draws `children`, so a screen that read the site while the WEBSITE module is off threw the library's
 * refusal into the payload as a not-found marker the browser never drew (paid-sweeps.md, item 5). The layout checks
 * the module first and draws "Website is not switched on" with the link to the modules page; every page under it asks
 * this first and returns nothing when the module is off, so the answer is a plain 200 with no marker.
 *
 *   const ctx = await websitePageContext();
 *   if (!ctx) return null;
 */
export async function websitePageContext() {
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  return (await isModuleOn(ctx.schoolId, "WEBSITE")) ? ctx : null;
}
