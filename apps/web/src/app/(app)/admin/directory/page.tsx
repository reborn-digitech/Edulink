import { redirect } from "next/navigation";
import { requireRole } from "@/lib/tenancy";

/**
 * The directory profile is edited on Settings now. This route stays so an
 * old link, a checklist step or a bookmark still lands somewhere useful —
 * on the card itself, not a page that only existed to hold it.
 */
export default async function AdminDirectoryPage() {
  await requireRole("ADMIN");
  redirect("/admin/settings#directory");
}
