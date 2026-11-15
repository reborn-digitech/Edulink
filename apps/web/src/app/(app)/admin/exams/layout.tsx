import type { ReactNode } from "react";
import { notFoundAtCollege } from "@/lib/school-only-page";

/** The school's exam series and their papers (the office's): a college's exams are its exam cell's. At a college every page here answers the app's 404 (notFoundAtCollege; the owner's word of 15 November 2026). */
export default async function AdminExamsLayout({ children }: { children: ReactNode }) {
  await notFoundAtCollege();
  return children;
}
