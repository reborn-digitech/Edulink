import { BackTo } from "@/components/back-to";
import { MyAppraisals } from "@/screens/staff/appraisal";

/** Not a tab: "‹ Back" above the title. What the head has shown me of my observations, targets and appraisals. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <MyAppraisals />
    </BackTo>
  );
}
