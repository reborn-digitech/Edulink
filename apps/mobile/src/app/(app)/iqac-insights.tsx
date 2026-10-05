import { BackTo } from "@/components/back-to";
import { InsightsScreen } from "@/screens/iqac/insights";

/** Not a tab: "‹ Back" above the title. The accreditation's actionable insights (5 Oct 2026), for the IQAC desk and the head. */
export default function Route() {
  return (
    <BackTo fallback="/(app)">
      <InsightsScreen />
    </BackTo>
  );
}
