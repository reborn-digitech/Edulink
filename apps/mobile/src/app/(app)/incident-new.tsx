import { BackTo } from "@/components/back-to";
import { StaffIncidentNew } from "@/screens/staff/incident-new";

/** Not a tab: "‹ Back" above the title, to the classes when the app was opened straight onto it. Recording an incident for one pupil. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/classes">
      <StaffIncidentNew />
    </BackTo>
  );
}
