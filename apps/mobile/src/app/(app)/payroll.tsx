import { BackTo } from "@/components/back-to";
import { StaffPayroll } from "@/screens/staff/payroll";

/** Not a tab: "‹ Back" above the title. The payroll summary, read-only, for the office and the head. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <StaffPayroll />
    </BackTo>
  );
}
