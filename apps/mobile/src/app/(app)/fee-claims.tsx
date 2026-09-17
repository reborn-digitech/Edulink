import { BackTo } from "@/components/back-to";
import { FeeClaims } from "@/screens/staff/fee-claims";

/** Not a tab: "‹ Back" above the title, to the fees overview when the app was opened straight onto it. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/fees">
      <FeeClaims />
    </BackTo>
  );
}
