import { BackTo } from "@/components/back-to";
import { FeeStructuresScreen } from "@/screens/college-office/structures";

/** Not a tab: "‹ Back" above the title. This year's fee structures, read (the parity batch, 10 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <FeeStructuresScreen />
    </BackTo>
  );
}
