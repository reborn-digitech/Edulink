import { BackTo } from "@/components/back-to";
import { TeacherSyllabus } from "@/screens/teacher/syllabus";

/** Not a tab: "‹ Back" above the title. One class's chapter list with its progress and lessons, ticked along by its teacher. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/classes">
      <TeacherSyllabus />
    </BackTo>
  );
}
