import { BackTo } from "@/components/back-to";
import { PredictorScreen } from "@/screens/iqac/predictor";

/** Not a tab: "‹ Back" above the title. The NAAC predictor, read (the parity batch, 10 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <PredictorScreen />
    </BackTo>
  );
}
