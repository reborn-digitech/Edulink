import { BackTo } from "@/components/back-to";
import { ConcessionsScreen } from "@/screens/college-office/concessions";

/** Not a tab: "‹ Back" above the title. The concession queue and the grant (the parity batch, 10 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <ConcessionsScreen />
    </BackTo>
  );
}
