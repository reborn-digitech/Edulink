import { redirect } from "next/navigation";

/**
 * The grades page split in two: assignment marks went to Assignments → Marked,
 * report cards went to Exams → Report cards. This lands on the first.
 */
export default function StudentGradesRedirect() {
  redirect("/student/assignments?tab=marked");
}
