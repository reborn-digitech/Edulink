import { BackTo } from "@/components/back-to";
import { MyAttendance } from "@/screens/teacher/my-attendance";

/** Not a tab: "‹ Back" above the title. A member of staff's own days and the "I'm in" check-in. */
export default function Route() {
  return (
    <BackTo fallback="/(app)">
      <MyAttendance />
    </BackTo>
  );
}
