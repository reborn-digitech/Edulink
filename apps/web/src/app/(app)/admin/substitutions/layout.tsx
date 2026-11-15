import type { ReactNode } from "react";
import { notFoundAtCollege } from "@/lib/school-only-page";

/** The school's day of cover for absent teachers and its printed board (the office's and the head's). At a college every page here answers the app's 404 (notFoundAtCollege; the owner's word of 15 November 2026). */
export default async function AdminSubstitutionsLayout({ children }: { children: ReactNode }) {
  await notFoundAtCollege();
  return children;
}
