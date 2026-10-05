import { BackTo } from "@/components/back-to";
import { ScenariosScreen } from "@/screens/iqac/scenarios";

/** Not a tab: "‹ Back" above the title. The simulator's saved scenarios, read-only (5 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)/iqac-insights">
      <ScenariosScreen />
    </BackTo>
  );
}
