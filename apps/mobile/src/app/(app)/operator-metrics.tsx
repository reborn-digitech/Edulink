import { BackTo } from "@/components/back-to";
import { OperatorMetrics } from "@/screens/operator/metrics";

/** Not a tab: "‹ Back" above the title, to /(app) when the app was opened straight onto it. */
export default function Route() {
  return (
    <BackTo fallback="/(app)">
      <OperatorMetrics />
    </BackTo>
  );
}
