import { BackTo } from "@/components/back-to";
import { FilingsDeskScreen } from "@/screens/iqac/filings";

/** Not a tab: "‹ Back" above the title. The filings as cards with the sign-off state (the parity batch, 10 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <FilingsDeskScreen />
    </BackTo>
  );
}
