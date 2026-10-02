import { BackTo } from "@/components/back-to";
import { OperatorPayouts } from "@/screens/operator/payouts";

/** Paid seats and payouts (decision 0004 as amended). Not a tab: "‹ Back" above the title, to /(app) when the app was opened straight onto it. */
export default function Route() {
  return (
    <BackTo fallback="/(app)">
      <OperatorPayouts />
    </BackTo>
  );
}
