import { BackTo } from "@/components/back-to";
import { TimetableEditor } from "@/screens/staff/timetable-editor";

/** Not a tab: "‹ Back" above the title, to /(app)/timetable when the app was opened straight onto it. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/timetable">
      <TimetableEditor />
    </BackTo>
  );
}
