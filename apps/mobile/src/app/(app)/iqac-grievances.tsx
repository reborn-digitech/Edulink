import { BackTo } from "@/components/back-to";
import { GrievancesDeskScreen } from "@/screens/iqac/grievances";

/** Not a tab: "‹ Back" above the title. The grievance line with the month's summary (the parity batch, 10 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <GrievancesDeskScreen />
    </BackTo>
  );
}
