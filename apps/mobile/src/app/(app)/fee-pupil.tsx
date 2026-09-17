import { BackTo } from "@/components/back-to";
import { FeePupil } from "@/screens/staff/fee-pupil";

/** Not a tab: "‹ Back" above the title, to the dues when the app was opened straight onto it. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/fees-dues">
      <FeePupil />
    </BackTo>
  );
}
