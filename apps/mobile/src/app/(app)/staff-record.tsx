import { BackTo } from "@/components/back-to";
import { StaffRecord } from "@/screens/staff/staff-record";

/** Not a tab: "‹ Back" above the title, to the roster when the app was opened straight onto it. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/staff">
      <StaffRecord />
    </BackTo>
  );
}
