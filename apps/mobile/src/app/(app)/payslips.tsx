import { BackTo } from "@/components/back-to";
import { MyPayslips } from "@/screens/shared/payslips";

/** Not a tab: "‹ Back" above the title. A member of staff's own payslips. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <MyPayslips />
    </BackTo>
  );
}
