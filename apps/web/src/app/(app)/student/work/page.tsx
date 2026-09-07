import { redirect } from "next/navigation";

/** "My work" became the Assignments page — one place for what a pupil owes. */
export default function StudentWorkRedirect() {
  redirect("/student/assignments");
}
