import { BackTo } from "@/components/back-to";
import { StaffIncident } from "@/screens/staff/incident";

/** Not a tab: "‹ Back" above the title, to the log when the app was opened straight onto it. One incident with its follow-up. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/incidents">
      <StaffIncident />
    </BackTo>
  );
}
