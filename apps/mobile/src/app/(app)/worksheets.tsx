import { BackTo } from "@/components/back-to";
import { TeacherWorksheets } from "@/screens/teacher/worksheets";

/** Not a tab: "‹ Back" above the title, to /(app)/practice when the app was opened straight onto it. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/practice">
      <TeacherWorksheets />
    </BackTo>
  );
}
