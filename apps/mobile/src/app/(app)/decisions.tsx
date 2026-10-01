import { BackTo } from "@/components/back-to";
import { StaffDecisions } from "@/screens/staff/decisions";

/** Not a tab: "‹ Back" above the title. The head's decision log, read from the audit rows the decisions wrote. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <StaffDecisions />
    </BackTo>
  );
}
