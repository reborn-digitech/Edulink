import type { ReactNode } from "react";
import { notFoundAtCollege } from "@/lib/school-only-page";

/** The school's exams, marks and report cards that the head, a pupil and a guardian read: a college student's are /student/exams. At a college every page here answers the app's 404 (notFoundAtCollege; the owner's word of 15 November 2026). */
export default async function ExamsLayout({ children }: { children: ReactNode }) {
  await notFoundAtCollege();
  return children;
}
