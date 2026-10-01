import { BackTo } from "@/components/back-to";
import { StaffAppraisal } from "@/screens/staff/appraisal";

/** Not a tab: "‹ Back" above the title, to the roster when the app was opened straight onto it. The head's notes on one member of staff. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/staff">
      <StaffAppraisal />
    </BackTo>
  );
}
