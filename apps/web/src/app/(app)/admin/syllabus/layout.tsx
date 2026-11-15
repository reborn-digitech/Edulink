import type { ReactNode } from "react";
import { notFoundAtCollege } from "@/lib/school-only-page";

/** The school's chapter lists and their coverage (the office's, and the head reads them): a college's syllabus is its academics'. At a college every page here answers the app's 404 (notFoundAtCollege; the owner's word of 15 November 2026). */
export default async function AdminSyllabusLayout({ children }: { children: ReactNode }) {
  await notFoundAtCollege();
  return children;
}
