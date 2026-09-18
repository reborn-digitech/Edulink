import { BackTo } from "@/components/back-to";
import { StaffCircularReach } from "@/screens/staff/circular-reach";

/** Not a tab: "‹ Back" above the title, to the bulletin when the app was opened straight onto it. Who a circular has reached, and the chase for the rest. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/bulletin">
      <StaffCircularReach />
    </BackTo>
  );
}
