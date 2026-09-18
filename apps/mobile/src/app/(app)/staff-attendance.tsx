import { BackTo } from "@/components/back-to";
import { StaffAttendance } from "@/screens/staff/staff-attendance";

/** Not a tab: "‹ Back" above the title. The staff register for a day and the month per person, for the office and the head. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <StaffAttendance />
    </BackTo>
  );
}
