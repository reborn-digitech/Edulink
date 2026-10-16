import { redirect } from "next/navigation";
import { websitePageContext } from "../gate";

/**
 * /admin/website/sections — one of the six screens of 15 October 2026, now a section of the one editor at /admin/website
 * (website-two, 16 Oct 2026): it opens the editor there, so a saved link or a notice still lands where it meant. The
 * module off, the layout's notice alone (a plain 200).
 */
export default async function WebsiteOldScreen() {
  if (!(await websitePageContext())) return null;
  redirect("/admin/website?s=home");
}
