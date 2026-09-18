import { BackTo } from "@/components/back-to";
import { StaffIncidents } from "@/screens/staff/incidents";

/** Not a tab: "‹ Back" above the title. The school's sick-room and incident log, for staff. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <StaffIncidents />
    </BackTo>
  );
}
